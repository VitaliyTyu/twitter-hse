import { SignInButton, useUser } from "@clerk/nextjs";
import { LoadingPage } from "~/components/LoadingPage";
import { api } from "~/utils/api";
import { CreatePostWizard } from "~/components/CreatePostWizard";
import { PostView } from "~/components/PostView";
import { PageLayout } from "~/components/PageLayout";
import { useState } from "react";

interface FeedProps {
    skip: number;
    take: number;
}

const Feed = ({ skip, take }: FeedProps) => {
    const { data: postsData, isLoading } = api.posts.getAll.useQuery({
        skip,
        take,
    });

    if (isLoading) return <LoadingPage />;

    if (!postsData || postsData.length === 0) {
        return <div>No posts available</div>;
    }

    return (
        <div className="flex grow flex-col overflow-y-auto ">
            {postsData.map((fullPost) => (
                <PostView {...fullPost} key={fullPost.post.id} />
            ))}
            {/* Check if there are fewer than 'take' posts to disable Next button */}
            {postsData.length < take && (
                <div className="flex justify-center text-gray-500 my-4">End of posts</div>
            )}
        </div>
    );
};



export default function Home() {
    const { isLoaded: userLoaded, isSignedIn } = useUser();
    const [page, setPage] = useState(0);
    const take = 10;
    const { data: postsData, isLoading } = api.posts.getAll.useQuery({
    });


    if (!userLoaded) return <div></div>;

    const handleNextPage = () => setPage((prevPage) => prevPage + 1);
    const handlePreviousPage = () => setPage((prevPage) => Math.max(prevPage - 1, 0));
    // Calculate total pages based on postsData length and take
    const totalPages = Math.ceil((postsData?.length ?? 0) / take);
    return (
        <PageLayout>
            <div className="flex items-center gap-3 border border-b border-gray-300 p-4 bg-gray-600">
                {!isSignedIn && (
                    <div className="flex justify-center">
                        <SignInButton />
                    </div>
                )}
                {isSignedIn && <CreatePostWizard />}
            </div>
            <Feed skip={page * take} take={take} />
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
        </PageLayout>

    );
}
