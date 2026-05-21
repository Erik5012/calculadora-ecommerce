import { get, put } from '@vercel/blob';

const STATE_PATH = 'calculadora-ecommerce/state.json';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      try {
        const file = await get(STATE_PATH);
        const text = await new Response(file.body).text();
        return send(res, 200, JSON.parse(text));
      } catch (error) {
        if (error?.status === 404 || error?.statusCode === 404) {
          return send(res, 200, { values: {}, updatedAt: null });
        }
        throw error;
      }
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const payload = {
        values: body.values && typeof body.values === 'object' ? body.values : {},
        updatedAt: new Date().toISOString()
      };

      await put(STATE_PATH, JSON.stringify(payload), {
        access: 'public',
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60
      });

      return send(res, 200, { ok: true, updatedAt: payload.updatedAt });
    }

    res.setHeader('Allow', 'GET, PUT');
    return send(res, 405, { error: 'Metodo nao permitido' });
  } catch (error) {
    console.error(error);
    return send(res, 500, {
      error: 'Falha ao acessar armazenamento online',
      detail: error?.message || 'Erro desconhecido'
    });
  }
}
