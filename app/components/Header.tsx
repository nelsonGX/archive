import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-slate-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image src="/file.svg" alt="Archive Logo" width={24} height={24} />
          <span>Archive</span>
        </Link>
        <nav>
          <ul className="flex gap-6">
            <li>
              <Link href="/scan" className="hover:text-blue-300 transition-colors">
                Scan
              </Link>
            </li>
            <li>
              <Link href="/upload" className="hover:text-blue-300 transition-colors">
                Upload
              </Link>
            </li>
            <li>
              <Link href="/settings" className="hover:text-blue-300 transition-colors">
                Settings
              </Link>
            </li>
            <li>
              <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors">
                Sign In
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}