import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
    <div className="rounded-[32px] bg-white p-10 text-center shadow-panel">
      <h1 className="font-display text-5xl text-slate-900">404</h1>
      <p className="mt-3 text-slate-500">The page you requested could not be found.</p>
      <Link to="/" className="mt-6 inline-flex rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
        Return Home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
