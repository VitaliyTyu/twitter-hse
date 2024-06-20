import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import Link from "next/link";

dayjs.extend(relativeTime);

interface IComment {
  content: string;
  createdAt: Date;
  author:
    | {
        id: string;
        username: string | null;
        imageUrl: string;
        externalUsername: string | null;
      }
    | undefined;
}

export const CommentView = ({ author, createdAt, content }: IComment) => {
  if (!author) return null;

  return (
    <div className="flex items-center gap-3 border border-x border-b border-slate-400 p-4">
      <div className="flex flex-col">
        <div className="flex">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <div>
            &nbsp;
            <span className="font-thin">{` · ${dayjs(
              createdAt,
            ).fromNow()}`}</span>
          </div>
        </div>

        <span className="overflow-anywhere">{content}</span>
      </div>
    </div>
  );
};
