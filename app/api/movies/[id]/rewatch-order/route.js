import { loadStore } from '../../../../../lib/store.mjs';
import { rewatchOrder } from '../../../../../lib/logic.mjs';
import { apiError } from '../../../../../lib/http.mjs';

export async function GET(request, { params }) {
  const { id } = await params;
  const result = rewatchOrder(loadStore().movies, id);
  return result.ok ? Response.json(result.value) : apiError(result);
}
