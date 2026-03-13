export async function GET() {
  const res = await fetch(
    "https://www.geoguessr.com/api/v4/ranked-system/progress/66d8d72d090048eaa472f4bf",
    {
      headers: { "x-client": "web" },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    return Response.json(null, { status: 502 });
  }

  const data = await res.json();
  return Response.json({
    divisionName: data.divisionName,
    rating: data.rating,
  });
}
