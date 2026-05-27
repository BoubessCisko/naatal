import { Client, Users, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const { phone } = JSON.parse(req.body || '{}');
  if (!phone) {
    return res.json({ success: false, error: 'phone required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const users = new Users(client);

  try {
    // Find existing user by phone, or create one
    let userId;
    try {
      const list = await users.list([`equal("phone", "${phone}")`]);
      if (list.users.length > 0) {
        userId = list.users[0].$id;
        log(`Found existing user ${userId} for ${phone}`);
      }
    } catch {}

    if (!userId) {
      const user = await users.create(ID.unique(), undefined, phone);
      userId = user.$id;
      log(`Created new user ${userId} for ${phone}`);
    }

    // Create a token — no SMS sent, server-side only
    const token = await users.createToken(userId);

    return res.json({
      success: true,
      userId: token.userId,
      secret: token.secret,
    });
  } catch (e) {
    error(`dev-auth failed: ${e.message}`);
    return res.json({ success: false, error: e.message }, 500);
  }
};
