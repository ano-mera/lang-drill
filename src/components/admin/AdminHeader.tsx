import Link from "next/link";

interface AdminHeaderProps {
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AdminHeader({ soundEnabled: _soundEnabled, onSoundToggle: _onSoundToggle }: AdminHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">問題管理</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              アプリに戻る
            </Link>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">管理者モード</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
