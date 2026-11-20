import { loadStore } from '../../../../../lib/store.mjs';
import { bookingQuote } from '../../../../../lib/logic.mjs';
import { apiError } from '../../../../../lib/http.mjs';

export async function GET(request, { params }) {
  const { id } = await params;
  const cinema = loadStore().cinemas.find((item) => item.id === id);
  if (!cinema) return apiError({ status: 404, code: 'NOT_FOUND', message: 'Cinema not found' });

  const groupSize = Number(request.nextUrl.searchParams.get('groupSize'));
  const result = bookingQuote(cinema, groupSize);
  return result.ok ? Response.json(result.value) : apiError(result);
}
