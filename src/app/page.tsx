import { Metadata } from "next";
import App from "./app";
import { Providers } from "./providers";

const appUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';

export const revalidate = 300;

export async function generateMetadata(props: { params: { slug?: string[] } | Promise<{ slug?: string[] }>, searchParams: { [key: string]: string | string[] | undefined } }): Promise<Metadata> {
    const { searchParams } = props;
    // Cast params to a promise to satisfy PageProps constraints
    const params = props.params as Promise<{ slug?: string[] }>;
    const resolvedParams = await params;
    
    // Build the path from params
    const path = resolvedParams.slug ? `/${resolvedParams.slug.join('/')}` : '/';
    
    // Create URL instance
    const url = new URL(path, appUrl);
    
    // Add all search parameters
    Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined) {
            if (Array.isArray(value)) {
                value.forEach(v => url.searchParams.append(key, v));
            } else {
                url.searchParams.append(key, value);
            }
        }
    });
    
    const frame = {
        version: "next",
        imageUrl: `${appUrl}/opengraph-image`,
        button: {
            title: "FC Footy App",
            action: {
                type: "launch_frame",
                name: "FC Footy App",
                url: url.href,
                splashImageUrl: `${appUrl}/defifa_spinner.gif`,
                splashBackgroundColor: "#010513",
            },
        },
    };
    
    return {
        title: "FC Footy App",
        openGraph: {
            title: "FC Footy App",
            description: "FC Footy App: Live Match Summaries, Fantasy League, Banter bot, Collectables & Contests",
        },
        other: {
            "fc:frame": JSON.stringify(frame),
        },
    };
}

export default function Home() {

    return (
        <Providers>
            <App />
        </Providers>
    );
}
