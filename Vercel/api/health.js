export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    status: 'online',
    hasKey: Boolean(process.env.GOOGLE_API_KEY),
  });
}