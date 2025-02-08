import Map from "./components/map";
import Sidebar from "./components/sidebar";

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <Map/>
      <Sidebar/>
    </div>
  );
}
