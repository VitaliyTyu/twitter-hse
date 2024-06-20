// Import necessary modules and components
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { LoadingPage } from "~/components/LoadingPage";
import { PageLayout } from "~/components/PageLayout";
import { PostView } from "~/components/PostView";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { api } from "~/utils/api";

// Interface for ProfileFeed props
interface ProfileFeedProps {
    userId: string;
    skip: number;
    take: number;
}

// ProfileFeed component to display user posts
const ProfileFeed: React.FC<ProfileFeedProps> = ({ userId, skip, take }) => {
    const { data, isLoading } = api.posts.getPostsByUserId.useQuery({
        userId,
        skip,
        take,
    });

    if (isLoading) return <LoadingPage />;

    if (!data || data.length === 0) {
        return <div className="text-center my-4">No posts available</div>;
    }

    return (
        <div className="flex flex-col overflow-y-auto">
            {data.map((fullPost) => (
                <PostView {...fullPost} key={fullPost.post.id} />
            ))}
            {/* Check if there are fewer than 'take' posts to disable Next button */}
            {data.length < take && (
                <div className="flex justify-center text-gray-500 my-4">End of posts</div>
            )}
        </div>
    );
};

// ProfilePage component
const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
    const { data } = api.profile.getUserByUsername.useQuery({
        username,
    });

    const [page, setPage] = useState(0);
    const take = 10;

    if (!data) return <div>404</div>;

    const { data: postsData } = api.posts.getPostsByUserId.useQuery({
        userId: data.id,
    });

    const handleNextPage = () => setPage((prevPage) => prevPage + 1);
    const handlePreviousPage = () => setPage((prevPage) => Math.max(prevPage - 1, 0));

    // Calculate total pages based on postsData length and take
    const totalPages = Math.ceil((postsData?.length ?? 0) / take);

    return (
        <>
            <Head>
                <title>{data.username ?? data.externalUsername}</title>
            </Head>

            <PageLayout>
                <div className="flex items-center rounded-lg gap-3 border border-b border-gray-300 p-4 bg-gray-600">
                    <div className="flex flex-col items-center">
                        <Image
                            src={data.imageUrl}
                            alt={`${data.username ?? data.externalUsername ?? "Unknown"}'s profile pic`}
                            width={128}
                            height={128}
                            className="rounded-full border-4 border-white"
                        />
                        <div className=" text-xl font-bold text-white">
                            {`@${data.username ?? data.externalUsername ?? "Unknown"}`}
                        </div>
                    </div>
                </div>
                {postsData ? (
                    <>
                        <ProfileFeed userId={data.id} skip={page * take} take={take} />
                        <div className="flex justify-between p-4">
                            <button
                                onClick={handlePreviousPage}
                                disabled={page === 0}
                                className={`px-4 py-2 rounded-lg ${page === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-gray-500 hover:bg-gray-600"
                                    } text-white`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={page === totalPages - 1}
                                className={`px-4 py-2 rounded-lg ${page === totalPages - 1
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-gray-500 hover:bg-gray-600"
                                    } text-white`}
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-lg font-semibold text-gray-700 mt-6">No posts available</div>
                )}

            </PageLayout>
        </>
    );
};

// Server-side rendering functions
export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();
    const slug = context.params?.slug;

    if (typeof slug !== "string") throw new Error("No slug provided");

    const username = slug.replace("@", "");

    await ssg.profile.getUserByUsername.prefetch({ username });

    return {
        props: { trpcState: ssg.dehydrate(), username },
    };
};

export const getStaticPaths: GetStaticPaths = () => {
    return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
