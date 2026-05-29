import { NextResponse } from 'next/server';

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonList<T>(
  data: T[],
  meta: { page: number; pageSize: number; total: number },
  status = 200,
) {
  return NextResponse.json(
    {
      data,
      meta: {
        ...meta,
        totalPages: Math.ceil(meta.total / meta.pageSize) || 1,
      },
    },
    { status },
  );
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details: unknown = [],
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status },
  );
}
