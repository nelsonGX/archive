import PageLayout from './components/PageLayout';
import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';

async function getDocuments() {
  const session = await auth();
  
  if (!session?.user) {
    return [];
  }
  
  try {
    const documents = await prisma.document.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        tags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

export default async function Home() {
  const documents = await getDocuments();
  
  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">All Documents</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            View and manage all your stored documents
          </p>
        </div>
        <Link 
          href="/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          Upload New
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              className="pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-900 w-80"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="flex gap-2">
            <button className="bg-zinc-200 dark:bg-zinc-700 p-2 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
            <button className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-zinc-100 dark:bg-zinc-700 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image
                src="/file.svg"
                alt="No documents"
                width={40}
                height={40}
                className="text-zinc-400"
              />
            </div>
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Upload your first document to get started
            </p>
            <Link
              href="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                    <Image
                      src={doc.fileType === 'pdf' ? '/file.svg' : `/file.svg`}
                      alt={doc.fileType.toUpperCase()}
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/documents/${doc.id}`}>
                      <h3 className="font-medium truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {doc.name}
                      </h3>
                    </Link>
                    <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    {doc.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {doc.tags.map(tag => (
                          <span 
                            key={tag.id} 
                            className="inline-block bg-zinc-100 dark:bg-zinc-700 text-xs px-2 py-0.5 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <Link
                    href={`/documents/${doc.id}?download=true`}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </Link>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}