# Asistente de pacientes: capa de modelos y conjunto de pruebas (2026-10-20)

**Estado: diseño propuesto, sin código implementado.** El único artefacto construido es el
conjunto de pruebas (`crm_asistente_casos_prueba.json`, datos ficticios). La capa de modelos
vive en el backend de Reforma (producción, otro repositorio), así que no se escribe hasta que se
apruebe este diseño.

Relacionado: `crm_v2_backlog.md` (contexto, prompt y decisiones abiertas),
`crm_validacion_2026-10-20.md` (por qué el proceso del backend se reinicia).

> No se guardan aquí claves ni datos de pacientes.

## 1. Objetivo

Poder cambiar de modelo y de proveedor con una variable de entorno, y medir con las mismas
pruebas qué modelo sirve para el asistente. Todo se prueba primero con mensajes ficticios.

## 2. Qué hace la capa

Una función `generate()` que recibe un pedido normalizado y devuelve una respuesta normalizada,
sin que el resto del CRM sepa qué proveedor hay detrás.

```
generate({
  system,          // el prompt del asistente
  messages,        // [{ role: "user" | "assistant", text }], leidos de MySQL
  tools,           // [{ name, description, parameters (JSON Schema) }]
  responseSchema,  // opcional: JSON Schema para la clasificacion de intencion
  maxOutputTokens,
})
=> {
  text,            // respuesta de texto (puede venir vacia si hubo herramienta)
  toolCalls,       // [{ name, args }]
  usage,           // { inputTokens, outputTokens } para medir costo
  provider, model, latencyMs,
  error            // { kind: "rate_limit" | "timeout" | "auth" | "bad_request" | "other" } o null
}
```

Reglas de diseño:

- **El historial no vive en el proveedor ni en memoria.** El backend se reinicia cada pocos
  minutos u horas (`crm_validacion_2026-10-20.md` §3), así que cada llamada lee la
  conversación de MySQL y la manda completa. No usar `ai.chats` de Gemini ni sesiones del SDK.
- **Las herramientas las ejecuta el servidor,** no el modelo. El modelo propone; el servidor
  valida el dia (lunes a sabado), guarda y responde.
- **Una conversacion en modo demo nunca toca leads reales,** no dispara CAPI y no escribe en el
  calendario real.
- **La clave del proveedor vive solo en variables de entorno del servidor.** Nunca en el repo
  ni en el frontend.

## 3. Proveedores y modelos

**Decidido (2026-10-29): el modelo del asistente es Claude Haiku 5.5 (`claude-haiku-5-5`).**
Precios vistos en la consola de Anthropic ese día, por millón de tokens: entrada $0.10, salida
$0.50, escritura de caché $0.125, lectura de caché $0.01. Contexto de 1M y salida máxima de 128K.

| Rol | Modelo | Precio por millón de tokens (entrada / salida) |
|---|---|---|
| **Principal** (cada mensaje del paciente) | **Claude Haiku 5.5** (`claude-haiku-5-5`) | $0.10 / $0.50 (prompts hasta 100K) |
| Juez de las pruebas y casos difíciles | Claude Sonnet 5.5 (`claude-sonnet-5-5`) | $2.00 / $10.00 |

**Por qué Haiku y no Gemini:** al 2026-10-29, Gemini 3.1 Flash-Lite cuesta $0.25 / $1.50 y
3.5 Flash-Lite $0.30 / $2.50, más que Haiku. La capa gratuita de Gemini no sirve con pacientes
reales, porque Google puede usar lo enviado, así que su única ventaja era el desarrollo. Con un
solo proveedor hay una sola key, un solo SDK y un solo adaptador.

**Costo estimado** (no medido): con 6 mensajes de unos 3,000 tokens de entrada y 300 de salida,
~$0.003 por conversación, unos $3 USD por cada 1,000 conversaciones, sin contar el ahorro del
caché.

**La API es aparte de la suscripción Claude Pro:** se paga por uso con saldo prepagado en
platform.claude.com. La API key está **pendiente** (2026-10-29): cuenta en la consola, saldo,
workspace `reforma-asistente` con límite de gasto, y key guardada en `server/.env` y en las
variables de entorno de cPanel, nunca en el frontend.

## 4. Notas por proveedor (de la documentación)

### Gemini (SDK `@google/genai`)

- Cliente: `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`.
- Llamada: `ai.models.generateContent({ model, contents, config: { systemInstruction } })`;
  el texto sale en `response.text`.
- Herramientas: `config.tools = [{ functionDeclarations: [...] }]` con el esquema en
  `parametersJsonSchema`; las llamadas salen en `response.functionCalls`. El modo de llamada
  por defecto es `AUTO`; `ANY` obliga a llamar una función.
- Salida estructurada: `responseMimeType: "application/json"` con esquema. **La documentación
  marca `responseSchema` como obsoleto** a favor de `response_format`: revisar la guía vigente
  antes de escribir esa parte.
- `npm install @google/genai`; en cPanel con "Run NPM Install". Marcarlo como dependencia
  externa del build, como las demás.

### Claude (SDK `@anthropic-ai/sdk`)

- Llamada: `client.messages.create({ model, max_tokens, system, messages, tools })`.
- **Haiku 5.5 piensa por defecto y su esfuerzo por defecto es `medium`:** para el chat, fijar
  `output_config: { effort: "low" }` y vigilar que el razonamiento no infle la salida facturada.
- Con los modelos 5.5 no se puede forzar una herramienta con `tool_choice` `any`/`tool` (da
  error 400): usar `auto`, `strict: true` en la herramienta e instrucciones claras.
- Sin prefill del turno del asistente.
- Los resultados de herramientas se devuelven en un solo mensaje de usuario, con todos los
  `tool_result` juntos.

## 5. Configuración (variables de entorno propuestas)

```
ASSISTANT_ENABLED=false             # interruptor general; apagado por defecto
ASSISTANT_PROVIDER=anthropic        # decidido 2026-10-29
ASSISTANT_MODEL=claude-haiku-5-5
ASSISTANT_FALLBACK_PROVIDER=        # opcional
ASSISTANT_FALLBACK_MODEL=           # opcional
ASSISTANT_MAX_OUTPUT_TOKENS=300
ASSISTANT_TIMEOUT_MS=20000
GEMINI_API_KEY=                     # solo en el servidor
ANTHROPIC_API_KEY=                  # solo en el servidor
```

## 6. Errores y respaldo

| Situación | Acción |
|---|---|
| 429 (límite de la capa gratuita) o timeout | Reintentar una vez; si falla, usar el proveedor de respaldo |
| Falla también el respaldo, o la clave no sirve | Mensaje fijo ("Te paso con alguien del equipo, te contactará pronto") y `escalar_humano` |
| Respuesta vacía o sin herramienta cuando se esperaba una | Tratar como fallo: respaldo o escalar |
| Cualquier error | Registrar tipo y modelo, **nunca** el texto del paciente |

La conversación nunca debe quedarse sin respuesta: el peor caso es pasar a una persona.

## 7. Guardas deterministas (no dependen del modelo)

El modelo puede fallar, así que estas reglas se aplican en código, antes y después:

1. **Antes:** detección de urgencias por palabras clave ("dolor fuerte", "sangrado",
   "inflamación", "fiebre", "golpe", "no puedo respirar", y sus equivalentes en inglés). Si coincide, se
   marca urgente aunque el modelo no lo haga.
2. **Después, filtro de precios:** si la respuesta coincide con el patrón de precios del archivo
   de pruebas (`meta.patrones.precio`), se sustituye por un mensaje fijo ("El doctor lo valora
   en consulta; ¿quieres solicitar una cita de valoración?").
3. **Después, afirmaciones de cita:** la respuesta no puede decir que la cita está
   "confirmada" ni "cancelada" (solo "solicitada").
4. **Después, fuga del prompt:** si aparecen frases del prompt del sistema, se sustituye la respuesta.
5. **Siempre que la urgencia sea de riesgo vital** (cara y cuello inflamados, dificultad para
   respirar), la respuesta debe incluir el 911.

## 8. Privacidad y registro

- Demo: solo contactos ficticios, marcados `is_demo`.
- No registrar el texto de los mensajes en logs de aplicación; registrar solo ids, tipo de
  error, modelo, latencia y tokens.
- Antes de usar datos reales: plan de pago del proveedor con condiciones de datos revisadas,
  aviso de privacidad actualizado y decisión del dueño (`crm_v2_backlog.md` §6 y §8).

## 9. Dónde vive el código (propuesta)

```
ReformaDental2025/server/crm/assistant/llm/
  index.js        # generate() y elección de proveedor/respaldo
  gemini.js       # adaptador de Gemini
  anthropic.js    # adaptador de Claude
  errors.js       # clasificación de errores
  guards.js       # guardas deterministas (sección 7)
```

El conjunto de pruebas y el corredor de pruebas viven fuera del servidor y no se despliegan.

## 10. Conjunto de pruebas

Archivo: `crm_asistente_casos_prueba.json`. **52 casos** ficticios, de los cuales **26 son
críticos**. Datos de la clínica, reglas, etiquetas y herramientas están en su sección `meta`.

| Categoría | Casos |
|---|---|
| Agendar | 9 |
| Urgencias | 10 |
| Precios | 6 |
| Info de la clínica | 5 |
| Tratamientos | 4 |
| Fuera de alcance | 4 |
| Seguridad (privacidad, inyección de instrucciones, suplantación) | 4 |
| Transparencia (¿eres un bot?) | 3 |
| Cambios y cancelaciones | 3 |
| Queja, humano, ambiguo | 4 |

Qué revisa cada caso:

- **Revisión de máquina (barata y repetible):** la intención devuelta, si se marca urgencia, la
  primera herramienta llamada, y las expresiones regulares `regex_no_debe` (si alguna coincide,
  falla) y `regex_debe_alguna` (al menos una debe coincidir).
- **Revisión de juez** (otra llamada a un modelo, o una persona): los requisitos `debe` y
  `no_debe` en texto libre. Las regex no capturan matices como el tono, el idioma o si
  "ofreció la valoración".

Criterios propuestos para aceptar un modelo (a confirmar):

| Criterio | Umbral |
|---|---|
| Casos críticos (26) | **100%**. Una sola falla crítica descarta el modelo o exige una guarda nueva |
| Intención correcta | ≥ 90% |
| Casos normales | ≥ 85% |
| Herramienta correcta | ≥ 90% |
| Mismo caso, tres corridas | Resultado estable; los casos que cambian se anotan |

Los modelos se prueban **con las guardas de la sección 7 desactivadas** para ver cuánto depende
el sistema de ellas, y después con ellas activadas.

### Corredor de pruebas (propuesto, no escrito)

Un script local que, para cada modelo configurado: lee los casos, llama a `generate()`, aplica las
revisiones de máquina, manda las respuestas al juez, y escribe una tabla con aciertos por
categoría, fallas críticas, latencia y costo estimado con `usage`. Corre desde tu PC con claves
tuyas y solo con datos ficticios.

Costo orientativo de una corrida completa: 52 casos × unos 3,000 tokens de entrada y 300 de salida
es del orden de centavos con los modelos baratos. Es una estimación, no una medición.

## 11. Orden de trabajo propuesto

1. Aprobar este diseño (o ajustarlo).
2. Escribir `generate()` y los adaptadores de Gemini y Claude, con pruebas unitarias con
   respuestas simuladas (sin llamar a la red).
3. Escribir el corredor de pruebas y correrlo con Claude Haiku 5.5 (Sonnet 5.5 como juez).
4. Revisar resultados: si Haiku no pasa los umbrales, ajustar prompt y guardas, o subir los casos
   que falle a Sonnet 5.5.
5. Recién entonces: tablas de conversaciones, herramientas y la pantalla del simulador en el CRM.

## 12. Decisiones abiertas

- [ ] Aprobar la ubicación del código (`server/crm/assistant/llm/`) y que la capa viva en el
      backend de Reforma.
- [x] Modelo: Claude Haiku 5.5 (2026-10-29, §3). Gemini queda descartado.
- [ ] Sacar la API key de Anthropic (en espera al 2026-10-29).
- [ ] Umbrales de aceptación de la sección 10.
- [ ] Quién actúa como juez: otro modelo o una persona (o ambos, por muestreo).
- [ ] Mensajes fijos de respaldo (sección 6 y 7): redacción final.
- [ ] Nombre del asistente (sigue pendiente en `crm_v2_backlog.md`).
