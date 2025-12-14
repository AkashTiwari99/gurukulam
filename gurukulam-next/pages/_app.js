import '../styles/global.css';
import '../styles/home.css';
import '../styles/about.css';
import '../styles/books.css';
import '../styles/campus.css';
import '../styles/contact.css';
import '../styles/programs.css';
import '../styles/mission.css';
import '../styles/sanatan-dharma.css';
import '../styles/gallery.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" href="/images/favicon.ico" />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
