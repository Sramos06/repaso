import Link from "next/link";

export default function ReviewerCard({ id, title, date }: { id: string; title: string; date: string }) {
  return (
    <Link href={`/viewer/${id}`} className="card">
      <h4>{title}</h4>
      <div className="meta"><span>{date}</span><span className="open">Open →</span></div>
    </Link>
  );
}
