import { SignInButton, useUser } from "@clerk/nextjs";
import { PageLayout } from "~/components/PageLayout";
import { CreatePostWizard } from "~/components/CreatePostWizard";
import FeedForFollowedUsers from "~/components/FeedForFollowedUsers";
import { useState } from "react";

export default function SubscriptionsPage() {
    const { isLoaded: userLoaded, isSignedIn } = useUser();
    const [page, setPage] = useState(0);
    const take = 10;

    if (!userLoaded) return <div></div>;

    const handleNextPage = () => setPage((prevPage) => prevPage + 1);
    const handlePreviousPage = () => setPage((prevPage) => Math.max(prevPage - 1, 0));
    
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
            <FeedForFollowedUsers skip={page * take} take={take} />
            <div className="flex justify-between p-4">
                <button
                    onClick={handlePreviousPage}
                    disabled={page === 0}
                    className={`px-4 py-2 rounded-lg ${page === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-gray-500 hover:bg-gray-600"} text-white`}
                >
                    Previous
                </button>
                <button
                    onClick={handleNextPage}
                    disabled={false} // you may want to add a condition to disable it when no more posts are available
                    className={`px-4 py-2 rounded-lg ${false ? "bg-gray-300 cursor-not-allowed" : "bg-gray-500 hover:bg-gray-600"} text-white`}
                >
                    Next
                </button>
            </div>
        </PageLayout>
    );
}
