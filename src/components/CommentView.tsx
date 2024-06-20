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
        <div className="flex items-center gap-6 p-6 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg mt-4 border border-black">
            <div className="flex flex-col rounded-lg">
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
