import Link from 'next/link';
import { requireSession } from '@/lib/session';
import { LogoutButton } from '@/components/logout-button';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <div className="container">
      <nav className="nav card">
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/admin">Admin</Link>
        </div>
        <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center' }}>
          <span className="badge">{session.user.role}</span>
          <LogoutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}
