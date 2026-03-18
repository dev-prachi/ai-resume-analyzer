import {Link, useParams,  useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta:() => any = () => ([
    { title : 'Resumind | Review'},
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
   const {auth, isLoading, fs, kv} = usePuterStore();
   const {id} = useParams();
   const [imageUrl, setImageUrl] = useState('');
   const [resumeUrl, setResumeUrl] = useState('');
   const [feedback, setFeedback] = useState<Feedback | null>(null);
   const navigate= useNavigate();

    useEffect( () => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading, auth, id]);

    useEffect(() => {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);

            if(!resume) return ;
            let data;

            try {
                data = JSON.parse(resume);
            } catch (err) {
                console.error("Resume data parse error:", err);
                return;
            }

            let parsedFeedback = null;

            try {
                if (!data.feedback) {

                    parsedFeedback = {
                        overallScore: 0,
                        ATS: { score: 0, tips: [] },
                        summary: "No feedback available",
                        details: {}
                    };
                } else {
                    parsedFeedback =
                        typeof data.feedback === "string"
                            ? JSON.parse(data.feedback)
                            : data.feedback;
                }
            } catch (err) {
                console.error("Feedback parse error:", err);

                parsedFeedback = {
                    overallScore: 0,
                    toneAndStyle: { score: 0 },
                    content: { score: 0 },
                    structure: { score: 0 },
                    skills: { score: 0 },
                    ATS: { score: 0, tips: [] },
                    summary: "Invalid feedback data",
                    details: {}
                };
            }

            setFeedback(parsedFeedback);

            console.log("FINAL FEEDBACK:", parsedFeedback);
            const resumeBlob = await fs.read(data.resumePath);
            if(!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl= URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            const imageBlob = await fs.read(data.imagePath);
            if(!imageBlob) return;
            const imageUrl= URL.createObjectURL(imageBlob);
            setImageUrl(imageUrl);

            console.log({resumeUrl, imageUrl, feedback:parsedFeedback});
            console.log("RAW KV DATA:", data);
            console.log("FEEDBACK TYPE:", typeof data.feedback);
            console.log("FEEDBACK VALUE:", data.feedback);
        }

        loadResume();
        }, [id, kv, fs]);
    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5"/>
                    <span className="text-gray-800text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] static top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 grdient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                src={imageUrl}
                                className="w-full h-full object-cover rounded-2xl"
                                title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {/*{feedback ? (*/}
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback}/>
                            <ATS score={feedback?.ATS?.score || 0} suggestions={feedback?.ATS?.tips || []} />
                            <Details feedback={feedback}/>

                        </div>
                    {/*) : (*/}
                    {/*    <img src="/images/resume-scan-2.gif" className="w-full"/>*/}
                    {/*) }*/}
                </section>
            </div>
        </main>
    );
};

export default Resume;