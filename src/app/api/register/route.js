import { registerUser } from '@/actions/register';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const result = await registerUser(formData);
    return Response.json(result);
  } catch (error) {
    console.error('API register error:', error);
    return Response.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
