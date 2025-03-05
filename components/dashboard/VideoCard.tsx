'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoData } from '@/lib/schemas';
import { updateVideo } from '@/lib/videoActions';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from './LoadingScreen';
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Player } from '@remotion/player';
import { CaptionedVideo } from '@/remotion/CaptionedVideo';
import { renderVideo } from '@/lambda/api';
import { useRendering } from '@/helpers/use-rendering';
import { COMP_NAME } from '@/types/constants';

const VideoCard = ({ video }: { video: VideoData }) => {
    const [title, setTitle] = useState(video.title);
    const [caption, setCaption] = useState(video.caption);
    const [script, setScript] = useState(video.script);
    const [isLoading, setIsLoading] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const hasChanges = useCallback(() => {
        return title !== video.title || caption !== video.caption || script !== video.script;
    }, [title, caption, script, video]);

    const handleUpdate = async () => {
        if (!hasChanges()) {
            toast({
                title: "No changes detected",
                description: "Please make changes before updating.",
            });
            return;
        }

        setIsLoading(true);
        try {
            await updateVideo({
                id: video.id,
                title,
                caption,
                script,
                oldScript: video.script
            });
            router.refresh();
            toast({
                title: "Success",
                description: "Video updated successfully!",
            });
        } catch (error) {
            console.error('Error updating video:', error);
            toast({
                title: "Error",
                description: "Error updating video. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const { renderMedia, state, undo } = useRendering("captioned-video", {
        audioSrc: video.audioSrc,
        images: video.imageUrls,
        subtitlesSrc: video.transcriptionSrc,
        durationInFrames: video.durationInFrames // Add this line
    });

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            await renderMedia();
            toast({
                title: "Success",
                description: "Video rendering started. It will download automatically when ready.",
            });
        } catch (error) {
            console.error('Error rendering video:', error);
            toast({
                title: "Error",
                description: "Error rendering video. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStockVideos = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/add-stock-videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoId: video.id }),
            });

            if (!response.ok) {
                throw new Error('Failed to add stock videos');
            }

            const data = await response.json();
            
            toast({
                title: "Success",
                description: "Stock videos are being added to your video. This may take a few minutes.",
            });
            
            // Refresh the page to show updated status
            router.refresh();
        } catch (error) {
            console.error('Error adding stock videos:', error);
            toast({
                title: "Error",
                description: "Failed to add stock videos. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (video.videoLink) {
            setVideoLoaded(true);
        } else {
            console.error('Missing video data:', {
                videoLink: video.videoLink
            });
            setVideoLoaded(false);
        }
    }, [video]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>UPCOMING VIDEO</CardTitle>
                    <p className="text-sm text-muted-foreground">Edit the details of your upcoming video</p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-[1fr,2fr] gap-6 mb-8">
                        <div className="space-y-4">
                            {videoLoaded ? (
                                <>
                                    {video.videoLink ? (
                                        <video
                                            src={video.videoLink}
                                            controls
                                            className="w-full aspect-[9/16] rounded-lg"
                                        />
                                    ) : (
                                        <Player
                                            component={CaptionedVideo}
                                            inputProps={{
                                                audioSrc: video.audioSrc,
                                                images: video.imageUrls,
                                                subtitlesSrc: video.transcriptionSrc,
                                                durationInFrames: video.durationInFrames || 300
                                            }}
                                            durationInFrames={video.durationInFrames || 300}
                                            fps={30}
                                            compositionHeight={1920}
                                            compositionWidth={1080}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '9/16',
                                            }}
                                            controls
                                        />
                                    )}
                                    {state.status === "done" && (
                                        <Button className="w-full" onClick={() => window.open(state.url, '_blank')}>
                                            Download Video
                                        </Button>
                                    )}
                                    {state.status === "rendering" && (
                                        <Button className="w-full" disabled>
                                            Rendering... {Math.round(state.progress * 100)}%
                                        </Button>
                                    )}
                                    {state.status === "error" && (
                                        <Button className="w-full" onClick={handleDownload}>
                                            Retry Render
                                        </Button>
                                    )}
                                    {state.status === "init" || state.status === "invoking" ? (
                                        <div className="space-y-2">
                                            <Button className="w-full" onClick={handleDownload}>
                                                Render and Download Video
                                            </Button>
                                            <Button 
                                                className="w-full" 
                                                onClick={handleAddStockVideos}
                                                variant="outline"
                                            >
                                                Add Stock Videos
                                            </Button>
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div className="w-full aspect-[9/16] bg-gray-200 rounded-lg flex items-center justify-center">
                                    <p>Video unavailable</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">TITLE</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={75}
                                />
                                <p className="text-sm text-muted-foreground text-right">{title.length} / 75</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="caption">CAPTION</Label>
                                <Textarea
                                    id="caption"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    maxLength={200}
                                />
                                <p className="text-sm text-muted-foreground text-right">{caption.length} / 200</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="script">SCRIPT</Label>
                                <Textarea
                                    id="script"
                                    value={script}
                                    onChange={(e) => setScript(e.target.value)}
                                    maxLength={1200}
                                    className="min-h-[200px]"
                                />
                                <p className="text-sm text-muted-foreground text-right">{script.length} / 1200</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Note: Always verify AI generated scripts for accuracy.</p>
                        </div>
                    </div>
                    <div className="space-y-4 mt-6">
                        <Button 
                            onClick={handleUpdate} 
                            disabled={!hasChanges() || isLoading}
                            className="w-full"
                        >
                            Update Video
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <LoadingScreen isOpen={isLoading} onOpenChange={setIsLoading} />
        </>
    );
};

export default VideoCard;
