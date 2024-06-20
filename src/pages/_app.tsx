import { ClerkProvider } from "@clerk/nextjs";
import { type AppType } from "next/dist/shared/lib/utils";
import Head from "next/head";
import Link from 'next/link';
import { Toaster } from "react-hot-toast";
import NavigationPanel from "~/components/NavigationPanel";

import "~/styles/globals.css";
import { api } from "~/utils/api";

const MyApp: AppType = ({ Component, pageProps }) => {
    return (


        <ClerkProvider {...pageProps}>
            <Head>
                <title>Twitter HSE</title>
            </Head>
            <NavigationPanel />
            <Toaster position="bottom-center" reverseOrder={false} />
            <Component {...pageProps} />
        </ClerkProvider>


    );
};

export default api.withTRPC(MyApp);
