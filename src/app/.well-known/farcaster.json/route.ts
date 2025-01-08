export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    "accountAssociation": {
      "header": "eyJmaWQiOjQxNjMsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg4NWY5ODg2YzQ4QjE3YjUzNGYzQTY0RjI0NjBkRDlDMDRBQjlhMjM2In0",
      "payload": "eyJkb21haW4iOiJmYy1mb290eS52ZXJjZWwuYXBwIn0",
      "signature": "MHg5NDYyN2I5ODFlNjRhNTEzNzk2NDUyZjA5NWQwYzE5YTc0YzE5MTExNmMxMDFmMjhmNmY0NDk1MmI0ZjE4ZGExM2M5ZGJmNDVkYzgxODAwYzNiYTkzZjlkN2UxYWZjZmEyNjQyMGU1MmNkNTA2MjQ1MWY1ZjQ1ZGIzNWVkYjc2NzFi"
    },
    frame: {
      version: "0.0.1",
      name: "FC Footy",
      iconUrl: `${appUrl}/512.png`,
      splashImageUrl: `${appUrl}/defifa_spinner.gif`,
      splashBackgroundColor: "#BD195D",
      homeUrl: appUrl,
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}