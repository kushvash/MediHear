// pages/api/test.js
export default async function handler(req, res) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/`);
    const data = await response.text();
    res.status(200).json({ message: data });
  }