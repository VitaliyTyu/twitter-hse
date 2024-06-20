import Image from "next/image";
import { type RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = ({ post, author }: PostWithUser) => {
    return (
        <div className="flex items-start gap-6 p-6 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg w-full mt-4 border-black-500 ">
            <div className="flex-shrink-0">
                <Link href={`/@${author.username}`}>
                    <Image
                        className="rounded-3xl border-4 border-gray-700 hover:border-black-500 transition duration-300"
                        src={author.imageUrl}
                        alt={`@${author.username}'s profile picture`}
                        height={64}
                        width={64}
                    />
                </Link>
            </div>

            <Link href={`/post/${post.id}`} className="text-gray-400 text-xs">
                <div className="flex flex-col justify-between w-full overflow-hidden">
                    <div className="flex items-center justify-between w-full">
                        <Link href={`/@${author.username}`} className="text-white hover:underline font-bold text-lg mr-3">
                            @{author.username}
                        </Link>
                            <span className="font-light">{dayjs(post.createdAt).fromNow()}</span>
                    </div>

                    <p className="mt-4 text-gray-300 leading-relaxed break-words w-full">
                        {post.content}
                    </p>
                </div>
            </Link>
        </div>

    );
};
