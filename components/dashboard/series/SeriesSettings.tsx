'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SeriesSettingsProps {
  videoId: string;
}

const SeriesSettings: React.FC<SeriesSettingsProps> = ({ videoId }) => {
    const [account, setAccount] = useState('');
    const [narrationVoice, setNarrationVoice] = useState('');
    const [videoDuration, setVideoDuration] = useState('');
    const [backgroundMusic, setBackgroundMusic] = useState('');

    const handleUpdate = async () => {
        // Implement your update logic here
        console.log("Updating series settings with:", { account, narrationVoice, videoDuration, backgroundMusic });
    };

    const handleDelete = async () => {
        // Implement your delete logic here
        console.log("Deleting video with ID:", videoId);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-purple-600">SERIES SETTINGS</CardTitle>
                <div className="flex justify-between items-center mt-4">
                    <h2 className="text-2xl font-bold">INTERESTING HISTORY</h2>
                    <Button variant="destructive" onClick={handleDelete}>DELETE</Button>
                </div>
                <div className="mt-4">
                    <Label>NEXT VIDEO SCHEDULED</Label>
                    <p>July 27, 2024 at 05:30 PM PDT (Local)</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="account">ACCOUNT</Label>
                    <Select onValueChange={setAccount}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="emailmeinstead">Email Me Instead</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>NARRATION VOICE</Label>
                    <RadioGroup onValueChange={setNarrationVoice}>
                        {["Echo", "Alloy", "Onyx", "Fable"].map((voice) => (
                            <div key={voice} className="flex items-center space-x-2">
                                <RadioGroupItem value={voice.toLowerCase()} id={voice.toLowerCase()} />
                                <Label htmlFor={voice.toLowerCase()}>{voice}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label>VIDEO DURATION</Label>
                    <div className="flex space-x-4">
                        <Button variant="outline" onClick={() => setVideoDuration('30-60')}>30 to 60 seconds</Button>
                        <Button variant="outline" onClick={() => setVideoDuration('60-90')}>60 to 90 seconds</Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="background-music">BACKGROUND MUSIC</Label>
                    <Input 
                        id="background-music" 
                        placeholder="Select background music" 
                        value={backgroundMusic}
                        onChange={(e) => setBackgroundMusic(e.target.value)}
                    />
                </div>

                <Button className="w-full bg-purple-600 text-white" onClick={handleUpdate}>UPDATE SERIES</Button>
            </CardContent>
        </Card>
    );
};

export default SeriesSettings;