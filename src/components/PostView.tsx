import Image from "next/image";
import { type RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faFire } from '@fortawesome/free-solid-svg-icons';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { api } from "~/utils/api";
import toast from "react-hot-toast";

// Prevent fontawesome from dynamically adding its CSS since we did it manually above
config.autoAddCss = false;

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = ({ post, author, reactions }: PostWithUser) => {

    const utils = api.useUtils();

    const addReactions = api.reactions.addReaction.useMutation({
        onSuccess: async () => {
            await utils.posts.invalidate();
        },
        onError: (e) => {
            const zodErrorMessage = e.data?.zodError?.fieldErrors?.content?.[0];
            if (zodErrorMessage) {
                toast.error(zodErrorMessage);
            } else {
                toast.error(e.message);
            }
        },
    });


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

            <div className="flex flex-col justify-between w-full overflow-hidden">
                <div className="flex items-center justify-between w-full">
                    <Link href={`/@${author.username}`} className="text-white hover:underline font-bold text-lg mr-3">
                        @{author.username}
                    </Link>
                    <span className="font-light">{dayjs(post.createdAt).fromNow()}</span>
                </div>

                <Link href={`/post/${post.id}`} className="text-gray-400 text-xs">
                    <p className="mt-4 text-gray-300 leading-relaxed break-words w-full">
                        {post.content}
                    </p>
                </Link>
            </div>


            <div className="flex items-center space-x-4 mt-4">
                <div>
                    {reactions.length}
                </div>
                <button
                    onClick={() => {
                        addReactions.mutate({ type: "like", postId: post.id });
                    }}
                    className="text-white hover:text-gray-300 transition duration-300">
                    <FontAwesomeIcon icon={faThumbsUp} />
                </button>
                <button
                    onClick={() => {
                        addReactions.mutate({ type: "dislike", postId: post.id });
                    }}
                    className="text-white hover:text-gray-300 transition duration-300">
                    <FontAwesomeIcon icon={faThumbsDown} />
                </button>
                <button
                    onClick={() => {
                        addReactions.mutate({ type: "fire", postId: post.id });
                    }}
                    className="text-white hover:text-gray-300 transition duration-300">
                    <FontAwesomeIcon icon={faFire} />
                </button>
            </div>
        </div>

    );
};
