import { Navigate, Outlet, Route, Routes } from 'react-router';
import { AppBar } from './components/AppBar';
import { CampaignLayout } from './components/CampaignLayout';
import { BrandKitScreen } from './screens/app/BrandKitScreen';
import { CampaignsScreen } from './screens/app/CampaignsScreen';
import { CreatorsScreen } from './screens/app/CreatorsScreen';
import { BriefScreen } from './screens/brief/BriefScreen';
import { DraftsScreen } from './screens/drafts/DraftsScreen';
import { ReadoutScreen } from './screens/readout/ReadoutScreen';
import { RosterScreen } from './screens/roster/RosterScreen';
import { StatusScreen } from './screens/status/StatusScreen';

function Shell() {
  return (
    <>
      <AppBar />
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="/campaigns" replace />} />
        <Route path="campaigns" element={<CampaignsScreen />} />
        <Route path="campaigns/:campaignId" element={<CampaignLayout />}>
          <Route index element={<Navigate to="brief" replace />} />
          <Route path="brief" element={<BriefScreen />} />
          <Route path="roster" element={<RosterScreen />} />
          <Route path="drafts" element={<DraftsScreen />} />
          <Route path="status" element={<StatusScreen />} />
          <Route path="readout" element={<ReadoutScreen />} />
        </Route>
        <Route path="creators" element={<CreatorsScreen />} />
        <Route path="brand-kit" element={<BrandKitScreen />} />
        <Route path="*" element={<Navigate to="/campaigns" replace />} />
      </Route>
    </Routes>
  );
}
