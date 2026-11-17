import ProjectClient from "./ProjectClient";
import { redirect } from "next/navigation";

interface Project {
  project_name: string;
}

export async function generateStaticParams() {
  const url = `${process.env.NEXT_PUBLIC_URL}/api/projects`;
  const res = await fetch(url);
  const body = await res.text();
  let projects: Project[];
  try {
    projects = JSON.parse(body);
  } catch {
    // Without this the build only says "Unexpected token '<'" and hides which URL answered HTML.
    throw new Error(
      `generateStaticParams: ${url} returned ${res.status} (${res.headers.get("content-type")}), not JSON: ${body.slice(0, 300)}`
    );
  }

  return projects.map((project) => ({
    project_name: project.project_name,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ project_name: string }>;
}) {
  const { project_name } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/project/${project_name}`
  );

  if (!res.ok) {
    redirect("/dashboard");
  }

  const project = await res.json();

  return <ProjectClient project={project} />;
}
