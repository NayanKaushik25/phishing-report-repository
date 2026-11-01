const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function request(
  path: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Something went wrong"
    );
  }

  return data;
}