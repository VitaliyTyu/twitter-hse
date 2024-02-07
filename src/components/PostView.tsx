import Image from "next/image";
import { type RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = ({ post, author }: PostWithUser) => {
  return (
    <div className="flex items-center gap-3 border border-x-2 border-b-2 border-slate-200 p-4">
      <div className="float-start flex h-full flex-col">
        <Image
          className="min-h-14 min-w-14 rounded-full"
          src={author.imageUrl}
          alt={`@${author.username}'s profile picture`}
          height={56}
          width={56}
        />
      </div>

      <div className="flex flex-col">
        <div className="flex">
          <span>{`@${author.username}`}</span>
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
