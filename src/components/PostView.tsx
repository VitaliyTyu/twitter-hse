import Image from "next/image";
import { type RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = ({ post, author }: PostWithUser) => {
  return (
    <div className="flex items-center gap-3 border border-x border-b border-slate-400 p-4">
      <div className="float-start flex h-full flex-col">
        <Link href={`/@${author.username}`}>
          <Image
            className="min-h-14 min-w-14 rounded-full"
            src={author.imageUrl}
            alt={`@${author.username}'s profile picture`}
            height={56}
            width={56}
          />
        </Link>
      </div>

      <div className="flex flex-col">
        <div className="flex">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          &nbsp;
          <span className="font-thin">{`· ${dayjs(
            post.createdAt,
          ).fromNow()}`}</span>
        </div>

        <span className="overflow-anywhere">{post.content}</span>
      </div>
    </div>
  );
};
