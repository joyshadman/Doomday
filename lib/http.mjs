export function apiError(result) {
  return Response.json(
    { error: { code: result.code, message: result.message } },
    { status: result.status },
  );
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
