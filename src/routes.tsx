import { canAccessPersonal } from './auth/personalPermissions';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResidentesPage } from './pages/ResidentesPage';
import { ResidenteDetallePage } from './pages/ResidenteDetallePage';
import { HabitacionesPage } from './pages/HabitacionesPage';
import { HistoriaClinicaPage } from './pages/HistoriaClinicaPage';
import { GestionMedicaPage } from './pages/GestionMedicaPage';
import { PersonalPage } from './pages/PersonalPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { ActividadesPage } from './pages/ActividadesPage';
import { ReportesPage } from './pages/ReportesPage';
import { AuditoriaPage } from './pages/AuditoriaPage';
import { ProtectedRoute } from './auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        Component: AppLayout,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', Component: DashboardPage },
          { path: 'residentes', Component: ResidentesPage },
          { path: 'residentes/:id', Component: ResidenteDetallePage },
          { path: 'habitaciones', Component: HabitacionesPage },
          { path: 'historia-clinica', Component: HistoriaClinicaPage },
          { path: 'gestion-medica', Component: GestionMedicaPage },
          { element: <ProtectedRoute canAccess={canAccessPersonal} />, children: [{ path: 'personal', Component: PersonalPage }] },
          { path: 'calendario', Component: CalendarioPage },
          { path: 'actividades', Component: ActividadesPage },
          { path: 'reportes', Component: ReportesPage },
          { path: 'auditoria', Component: AuditoriaPage },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
