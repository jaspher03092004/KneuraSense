import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // 1. Kick them out if they don't have a token at all
  if (!token) redirect('/login');

  let payload;
  try {
    // 2. Decode the JWT to see who is trying to access the page
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload: decoded } = await jwtVerify(token, secretKey);
    payload = decoded;
  } catch (err) {
    redirect('/login');
  }

  // 3. Security Check: Ensure only users with the 'admin' role can see this page
  if (payload.role !== 'admin') {
    redirect('/login');
  }

  // 4. Fetch the admin's actual profile details from the database
  const admin = await prisma.admin.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, fullName: true }
  });

  if (!admin) redirect('/login');

  // 5. Format the user object exactly how the Sidebar component expects it
  const user = {
    id: admin.id,
    fullName: admin.fullName,
    email: admin.email,
    role: 'admin' 
  };

  // 6. Render the Client Layout wrapper and pass the user down
  return (
    <AdminLayoutClient user={user}>
      {children}
    </AdminLayoutClient>
  );
}