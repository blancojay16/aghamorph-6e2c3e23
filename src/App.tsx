import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { startCacheLoop } from "@/lib/offline-cache";

import RoleChooser from "@/routes/index";
import StudentHome from "@/routes/student";
import MatchingGame from "@/routes/matching";
import GamesHub from "@/routes/games.index";
import Jigsaw from "@/routes/games.jigsaw";
import SortTheEaters from "@/routes/games.label";
import Memory from "@/routes/games.memory";
import Quiz from "@/routes/games.quiz";
import TraceGame from "@/routes/games.trace";
import PlayPage from "@/routes/play.$videoId";
import TeacherLayout from "@/routes/teacher";
import TeacherDashboard from "@/routes/teacher.index";
import TeacherGroups from "@/routes/teacher.students";
import RankingsPage from "@/routes/teacher.rankings";
import TeacherGames from "@/routes/teacher.games";
import VideoEditor from "@/routes/teacher.video.$videoId";
import TraceAdmin from "@/routes/teacher.trace";

const qc = new QueryClient();

function CacheKick() {
  useEffect(() => {
    const stop = startCacheLoop();
    return () => stop?.();
  }, []);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <CacheKick />
        <Switch>
          <Route exact path="/" component={RoleChooser} />
          <Route exact path="/student" component={StudentHome} />
          <Route exact path="/matching" component={MatchingGame} />
          <Route exact path="/games" component={GamesHub} />
          <Route exact path="/games/jigsaw" component={Jigsaw} />
          <Route exact path="/games/label" component={SortTheEaters} />
          <Route exact path="/games/memory" component={Memory} />
          <Route exact path="/games/quiz" component={Quiz} />
          <Route exact path="/games/trace" component={TraceGame} />
          <Route exact path="/play/:videoId" component={PlayPage} />
          <Route path="/teacher">
            <TeacherLayout>
              <Switch>
                <Route exact path="/teacher" component={TeacherDashboard} />
                <Route exact path="/teacher/students" component={TeacherGroups} />
                <Route exact path="/teacher/rankings" component={RankingsPage} />
                <Route exact path="/teacher/games" component={TeacherGames} />
                <Route exact path="/teacher/trace" component={TraceAdmin} />
                <Route exact path="/teacher/video/:videoId" component={VideoEditor} />
              </Switch>
            </TeacherLayout>
          </Route>
        </Switch>
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
