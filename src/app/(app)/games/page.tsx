import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GamesPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Games"
        description="Challenge your friends to fun, AI-powered minigames."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Rally Game</CardTitle>
                <CardDescription>A turn-based tennis point simulator. Outsmart your opponent!</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button disabled>Play Now (Coming Soon)</Button>
            </CardFooter>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Guess the Legend</CardTitle>
                <CardDescription>Test your sports trivia knowledge against friends or the AI.</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button disabled>Play Now (Coming Soon)</Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
