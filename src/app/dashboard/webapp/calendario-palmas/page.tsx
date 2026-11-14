"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast, Toaster } from "react-hot-toast";
import { RefreshCw, Loader2, CheckCircle, XCircle, MessageSquare, BedDouble, Mail, Phone, DollarSign, X, Plus, Download, Info } from "lucide-react";
import { BookingDetailModal } from "./components/BookingDetailModal";
import { BookingFormModal } from "./components/BookingFormModal";
import { CalendarView } from "./components/CalendarView";
import { SubscriptionButton, InstallModal } from "./components/Subscription";
import { SourceBadge, StatCard, EmptyState, SortHeader } from "./components/ui";
import { API_BASE_URL, ROOM_NAMES, ROOM_COLORS, DEFAULT_ROOM_COLOR } from "./constants";
import type { Booking, ContactMessage, Tab } from "./types";
import { parseDateLocal, generateICS, downloadICS } from "./utils";

export default function CalendarioPalmasPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<string | undefined>();
  const [createDefaultRoom, setCreateDefaultRoom] = useState<string | undefined>();

  // Calendar month state (lifted for stats filtering)
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Bookings table filter/sort/pagination
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  const [bookingRoomFilter, setBookingRoomFilter] = useState("");
  const [bookingSortField, setBookingSortField] = useState("created_at");
  const [bookingSortDir, setBookingSortDir] = useState<"asc" | "desc">("desc");
  const [bookingPage, setBookingPage] = useState(1);
  const PAGE_SIZE = 10;

  // Contacts table filter/sort
  const [contactSearch, setContactSearch] = useState("");
  const [contactSortField, setContactSortField] = useState("created_at");
  const [contactSortDir, setContactSortDir] = useState<"asc" | "desc">("desc");

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar las reservas");
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar los contactos");
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchContacts();
  }, [fetchBookings, fetchContacts]);

  const handleCancelBooking = async (id: number) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: booking.email }),
      });
      if (!res.ok) throw new Error();
      toast.success("Reserva cancelada");
      setSelectedBooking(null);
      fetchBookings();
    } catch {
      toast.error("Error al cancelar la reserva");
    }
  };

  const handleOpenEdit = (booking: Booking) => {
    setSelectedBooking(null);
    setEditingBooking(booking);
  };

  const handleCreateForDay = (dateStr: string, roomId?: string) => {
    setCreateDefaultDate(dateStr);
    setCreateDefaultRoom(roomId);
    setShowCreateModal(true);
  };

  const closeFormModal = () => {
    setShowCreateModal(false);
    setEditingBooking(null);
    setCreateDefaultDate(undefined);
    setCreateDefaultRoom(undefined);
  };

  // Month overlap helper
  function bookingOverlapsMonth(b: Booking, year: number, month: number): boolean {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    const checkIn = parseDateLocal(b.check_in.slice(0, 10));
    const checkOut = parseDateLocal(b.check_out.slice(0, 10));
    return checkIn < monthEnd && checkOut > monthStart;
  }

  const monthBookings = useMemo(
    () => bookings.filter((b) => bookingOverlapsMonth(b, calYear, calMonth)),
    [bookings, calYear, calMonth],
  );
  const confirmedMonthBookings = monthBookings.filter((b) => b.status === "confirmed");
  const monthRevenue = confirmedMonthBookings.reduce((s, b) => s + Number(b.total), 0);


  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (bookingSearch) {
      const q = bookingSearch.toLowerCase();
      list = list.filter((b) =>
        b.full_name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.confirmation_number.toLowerCase().includes(q) ||
        (b.phone && b.phone.toLowerCase().includes(q))
      );
    }
    if (bookingStatusFilter) list = list.filter((b) => b.status === bookingStatusFilter);
    if (bookingRoomFilter) list = list.filter((b) => b.room_id === bookingRoomFilter);
    list.sort((a, b) => {
      let va: string | number, vb: string | number;
      if (bookingSortField === "nights" || bookingSortField === "total") {
        va = Number(a[bookingSortField as keyof Booking]) || 0;
        vb = Number(b[bookingSortField as keyof Booking]) || 0;
      } else {
        va = String(a[bookingSortField as keyof Booking] ?? "");
        vb = String(b[bookingSortField as keyof Booking] ?? "");
      }
      if (va < vb) return bookingSortDir === "asc" ? -1 : 1;
      if (va > vb) return bookingSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [bookings, bookingSearch, bookingStatusFilter, bookingRoomFilter, bookingSortField, bookingSortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const paginatedBookings = useMemo(
    () => filteredBookings.slice((bookingPage - 1) * PAGE_SIZE, bookingPage * PAGE_SIZE),
    [filteredBookings, bookingPage],
  );

  const filteredContacts = useMemo(() => {
    let list = [...contacts];
    if (contactSearch) {
      const q = contactSearch.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      const va = String(a[contactSortField as keyof ContactMessage] ?? "");
      const vb = String(b[contactSortField as keyof ContactMessage] ?? "");
      if (va < vb) return contactSortDir === "asc" ? -1 : 1;
      if (va > vb) return contactSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [contacts, contactSearch, contactSortField, contactSortDir]);

  useEffect(() => { setBookingPage(1); }, [bookingSearch, bookingStatusFilter, bookingRoomFilter, bookingSortField, bookingSortDir]);

  const handleBookingSort = (field: string) => {
    if (bookingSortField === field) setBookingSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setBookingSortField(field); setBookingSortDir("asc"); }
  };

  const handleContactSort = (field: string) => {
    if (contactSortField === field) setContactSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setContactSortField(field); setContactSortDir("asc"); }
  };

  const getStatusBadge = (status: string) => {
    if (status === "confirmed") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: "rgba(16,185,129,0.12)", color: "var(--ec-success)" }}>
          <CheckCircle className="h-3 w-3" /> Confirmada
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: "rgba(239,68,68,0.12)", color: "var(--ec-danger)" }}>
        <XCircle className="h-3 w-3" /> Cancelada
      </span>
    );
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "calendar", label: "Calendario" },
    { id: "bookings", label: "Reservas", count: loadingBookings ? undefined : bookings.length },
    { id: "contacts", label: "Contactos", count: loadingContacts ? undefined : contacts.length },
  ];

  return (
    <div className="fade-in-up" style={{ padding: "28px 24px" }}>
      <Toaster />

      {/* Install modal */}
      {showInstallModal && <InstallModal onClose={() => setShowInstallModal(false)} apiBaseUrl={API_BASE_URL} />}

      {/* Detail modal */}
      {selectedBooking && !editingBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancel={handleCancelBooking}
          onEdit={handleOpenEdit}
          onRefresh={fetchBookings}
        />
      )}

      {/* Create / Edit form modal */}
      {(showCreateModal || editingBooking) && (
        <BookingFormModal
          booking={editingBooking}
          defaultDate={createDefaultDate}
          defaultRoom={createDefaultRoom}
          onClose={closeFormModal}
          onSuccess={() => fetchBookings()}
        />
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="h-eyebrow" style={{ marginBottom: 6 }}>⎯⎯⎯  PALMAS RECOVERY</div>
            <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.025em", color: "var(--ec-text)", marginBottom: 6 }}>
              Calendario Palmas
            </h1>
            <p style={{ color: "var(--ec-text-dim)", fontSize: 13 }}>
              Panel de reservas y contactos · Palmas Recovery
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, background: "#F59E0B", color: "white", fontSize: 14, fontWeight: 600, border: 0, cursor: "pointer" }}
            >
              <Plus className="h-4 w-4" />
              Nueva Reserva
            </button>
            <button
              onClick={() => {
                if (bookings.length === 0) { toast.error("No hay reservas para exportar"); return; }
                const ics = generateICS(bookings);
                downloadICS(ics, "palmas-recovery-reservas.ics");
                toast.success(`${bookings.length} reservas exportadas`);
              }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--ec-border)", background: "var(--ec-surface-2)", color: "var(--ec-text)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              title="Exportar a iCalendar (.ics)"
            >
              <Download className="h-4 w-4" />
              Exportar citas
            </button>
            <SubscriptionButton apiBaseUrl={API_BASE_URL} />
            <button
              onClick={() => setShowInstallModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--ec-border)", background: "var(--ec-surface-2)", color: "var(--ec-text)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              title="Guía de instalación en iCloud"
            >
              <Info className="h-4 w-4" />
              Instalación
            </button>
            <button
              onClick={() => { fetchBookings(); fetchContacts(); }}
              style={{ padding: "8px", borderRadius: 10, border: "1px solid var(--ec-border)", background: "var(--ec-surface-2)", color: "var(--ec-text)", cursor: "pointer", display: "flex", alignItems: "center" }}
              title="Refrescar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats — filtradas por el mes visible del calendario */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BedDouble className="h-5 w-5" />}
            iconStyle={{ background: "rgba(59,130,246,0.12)", color: "var(--ec-info)" }}
            label="Reservas del mes"
            value={loadingBookings ? "—" : monthBookings.length}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            iconStyle={{ background: "rgba(16,185,129,0.12)", color: "var(--ec-success)" }}
            label="Confirmadas del mes"
            value={loadingBookings ? "—" : confirmedMonthBookings.length}
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            iconStyle={{ background: "rgba(245,158,11,0.12)", color: "var(--ec-warning)" }}
            label="Ingresos del mes"
            value={loadingBookings ? "—" : `$${monthRevenue.toLocaleString()}`}
          />
          <StatCard
            icon={<MessageSquare className="h-5 w-5" />}
            iconStyle={{ background: "rgba(168,85,247,0.12)", color: "var(--ec-d5)" }}
            label="Total Contactos"
            value={loadingContacts ? "—" : contacts.length}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--ec-surface-2)", borderRadius: 10, padding: 4, width: "fit-content", flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: "pointer", border: 0, transition: "all 0.15s",
                background: activeTab === t.id ? "var(--ec-surface-0)" : "transparent",
                color: activeTab === t.id ? "var(--ec-text)" : "var(--ec-text-dim)",
                boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              }}
            >
              {t.label}
              {t.count !== undefined ? ` (${t.count})` : ""}
            </button>
          ))}
        </div>

        {/* Calendar tab */}
        {activeTab === "calendar" &&
          (loadingBookings ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
          ) : (
            <CalendarView
              bookings={bookings}
              onCreateForDay={handleCreateForDay}
              viewYear={calYear}
              viewMonth={calMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          ))}

        {/* Bookings tab */}
        {activeTab === "bookings" && (
          <div className="ec-project-card" style={{ borderRadius: 14, overflow: "hidden" }}>
            {loadingBookings ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState
                icon={<BedDouble className="h-8 w-8 text-gray-400" />}
                title="Sin reservas"
                desc="Todavía no hay reservas registradas."
              />
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--ec-hairline)", background: "var(--ec-surface-1)" }}>
                  <input
                    type="text"
                    placeholder="Buscar nombre, email, confirmación..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="ec-field-input"
                    style={{ flex: "1 1 220px", minWidth: 180, padding: "6px 12px", fontSize: 13 }}
                  />
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="ec-field-input"
                    style={{ flex: "0 1 160px", padding: "6px 10px", fontSize: 13 }}
                  >
                    <option value="">Todos los estados</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                  <select
                    value={bookingRoomFilter}
                    onChange={(e) => setBookingRoomFilter(e.target.value)}
                    className="ec-field-input"
                    style={{ flex: "0 1 185px", padding: "6px 10px", fontSize: 13 }}
                  >
                    <option value="">Todas las habitaciones</option>
                    {Object.entries(ROOM_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                  {(bookingSearch || bookingStatusFilter || bookingRoomFilter) && (
                    <button
                      onClick={() => { setBookingSearch(""); setBookingStatusFilter(""); setBookingRoomFilter(""); }}
                      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--ec-border)", background: "transparent", color: "var(--ec-text-dim)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <X size={12} /> Limpiar
                    </button>
                  )}
                  <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--ec-text-dim)", marginLeft: "auto" }}>
                    {filteredBookings.length} de {bookings.length}
                  </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--ec-hairline)", background: "var(--ec-surface-1)" }}>
                        <SortHeader label="Confirmación" field="confirmation_number" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                        <SortHeader label="Huésped" field="full_name" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                        <SortHeader label="Habitación" field="room_id" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                        <SortHeader label="Check-in" field="check_in" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                        <SortHeader label="Check-out" field="check_out" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                        <SortHeader label="Noches" field="nights" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                        <SortHeader label="Total" field="total" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                        <SortHeader label="Estado" field="status" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                        <SortHeader label="Origen" field="source" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                        <th style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--ec-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", whiteSpace: "nowrap" }}>Recordatorio</th>
                        <SortHeader label="Creado" field="created_at" sortField={bookingSortField} sortDir={bookingSortDir} onSort={handleBookingSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBookings.map((booking) => {
                        const rc = ROOM_COLORS[booking.room_id] ?? DEFAULT_ROOM_COLOR;
                        return (
                          <tr key={booking.id} onClick={() => setSelectedBooking(booking)} style={{ borderBottom: "1px solid var(--ec-hairline)", cursor: "pointer", transition: "background 0.1s" }} className="hover:bg-[var(--ec-surface-1)]">
                            <td style={{ padding: "10px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--ec-text-dim)" }}>#{booking.confirmation_number}</td>
                            <td style={{ padding: "10px 16px" }}>
                              <div style={{ fontWeight: 500, color: "var(--ec-text)" }}>{booking.full_name}</div>
                              <div style={{ fontSize: 12, color: "var(--ec-text-dim)" }}>{booking.email}</div>
                            </td>
                            <td style={{ padding: "10px 16px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: rc.bg, color: rc.color }}>{ROOM_NAMES[booking.room_id] ?? booking.room_id}</span>
                            </td>
                            <td style={{ padding: "10px 16px", color: "var(--ec-text-muted)", whiteSpace: "nowrap" }}>{parseDateLocal(booking.check_in.slice(0, 10)).toLocaleDateString("es-MX")}</td>
                            <td style={{ padding: "10px 16px", color: "var(--ec-text-muted)", whiteSpace: "nowrap" }}>{parseDateLocal(booking.check_out.slice(0, 10)).toLocaleDateString("es-MX")}</td>
                            <td style={{ padding: "10px 16px", textAlign: "center", color: "var(--ec-text-muted)" }}>{booking.nights}</td>
                            <td style={{ padding: "10px 16px", fontWeight: 600, color: "var(--ec-text)" }}>${booking.total}</td>
                            <td style={{ padding: "10px 16px" }}>{getStatusBadge(booking.status)}</td>
                            <td style={{ padding: "10px 16px" }}><SourceBadge source={booking.source} /></td>
                            <td style={{ padding: "10px 16px", textAlign: "center" }}>
                              {booking.reminder_sent_at ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "rgba(16,185,129,0.12)", color: "var(--ec-success)", whiteSpace: "nowrap" }}>
                                  <CheckCircle className="h-3 w-3" /> Enviado
                                </span>
                              ) : booking.status === "confirmed" && new Date(booking.check_in) >= new Date(new Date().toDateString()) ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "rgba(245,158,11,0.12)", color: "var(--ec-warning)", whiteSpace: "nowrap" }}>
                                  <Mail className="h-3 w-3" /> Pendiente
                                </span>
                              ) : (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "var(--ec-surface-2)", color: "var(--ec-text-dim)", whiteSpace: "nowrap" }}>
                                  —
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "10px 16px", color: "var(--ec-text-dim)", whiteSpace: "nowrap", fontSize: 12 }}>
                              {booking.created_at ? new Date(booking.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 16px", borderTop: "1px solid var(--ec-hairline)" }}>
                    <button onClick={() => setBookingPage((p) => Math.max(1, p - 1))} disabled={bookingPage <= 1}
                      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--ec-border)", background: "var(--ec-surface-2)", color: bookingPage <= 1 ? "var(--ec-text-dim)" : "var(--ec-text)", fontSize: 13, cursor: bookingPage <= 1 ? "not-allowed" : "pointer", opacity: bookingPage <= 1 ? 0.5 : 1 }}>
                      Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setBookingPage(p)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: "none",
                          background: p === bookingPage ? "#f59e0b" : "var(--ec-surface-2)",
                          color: p === bookingPage ? "white" : "var(--ec-text)",
                          fontSize: 13, fontWeight: p === bookingPage ? 600 : 400,
                          cursor: "pointer", transition: "all 0.1s",
                        }}
                      >{p}</button>
                    ))}
                    <button onClick={() => setBookingPage((p) => Math.min(totalPages, p + 1))} disabled={bookingPage >= totalPages}
                      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--ec-border)", background: "var(--ec-surface-2)", color: bookingPage >= totalPages ? "var(--ec-text-dim)" : "var(--ec-text)", fontSize: 13, cursor: bookingPage >= totalPages ? "not-allowed" : "pointer", opacity: bookingPage >= totalPages ? 0.5 : 1 }}>
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Contacts tab */}
        {activeTab === "contacts" && (
          <div className="ec-project-card" style={{ borderRadius: 14, overflow: "hidden" }}>
            {loadingContacts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : contacts.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-8 w-8 text-gray-400" />}
                title="Sin contactos"
                desc="Todavía no hay mensajes de contacto registrados."
              />
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--ec-hairline)", background: "var(--ec-surface-1)" }}>
                  <input
                    type="text"
                    placeholder="Buscar nombre, email, mensaje..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="ec-field-input"
                    style={{ flex: "1 1 220px", minWidth: 180, padding: "6px 12px", fontSize: 13 }}
                  />
                  {contactSearch && (
                    <button
                      onClick={() => setContactSearch("")}
                      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--ec-border)", background: "transparent", color: "var(--ec-text-dim)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <X size={12} /> Limpiar
                    </button>
                  )}
                  <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--ec-text-dim)", marginLeft: "auto" }}>
                    {filteredContacts.length} de {contacts.length}
                  </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--ec-hairline)", background: "var(--ec-surface-1)" }}>
                        <SortHeader label="Nombre" field="name" sortField={contactSortField} sortDir={contactSortDir} onSort={handleContactSort} />
                        <SortHeader label="Contacto" field="email" sortField={contactSortField} sortDir={contactSortDir} onSort={handleContactSort} />
                        <SortHeader label="Mensaje" field="message" sortField={contactSortField} sortDir={contactSortDir} onSort={handleContactSort} />
                        <SortHeader label="Fecha" field="created_at" sortField={contactSortField} sortDir={contactSortDir} onSort={handleContactSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} style={{ borderBottom: "1px solid var(--ec-hairline)" }}>
                          <td style={{ padding: "10px 16px", fontWeight: 500, color: "var(--ec-text)" }}>{contact.name}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--ec-text-muted)" }}><Mail size={11} style={{ flexShrink: 0 }} />{contact.email}</div>
                            {contact.phone && <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ec-text-dim)", marginTop: 2 }}><Phone size={11} style={{ flexShrink: 0 }} />{contact.phone}</div>}
                          </td>
                          <td style={{ padding: "10px 16px", color: "var(--ec-text-muted)", maxWidth: 280 }}>
                            <p style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{contact.message}</p>
                          </td>
                          <td style={{ padding: "10px 16px", color: "var(--ec-text-dim)", whiteSpace: "nowrap", fontSize: 12 }}>
                            {new Date(contact.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
