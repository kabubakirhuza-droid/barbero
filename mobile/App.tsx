import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './src/theme/colors';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { ModalToastProvider } from './src/context/ModalToastContext';
import { LanguageProvider, useTranslation } from './src/i18n/LanguageContext';
import { Header } from './src/components/Header';
import { FloatingTabBar, TabKey } from './src/components/FloatingTabBar';
import { AnimatedSplashScreen } from './src/components/AnimatedSplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { RoleSelectionScreen } from './src/screens/RoleSelectionScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { JadvalScreen } from './src/screens/JadvalScreen';
import { AnalitikaScreen } from './src/screens/AnalitikaScreen';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { ProfilScreen } from './src/screens/ProfilScreen';
import { ClientHomeScreen } from './src/screens/ClientHomeScreen';
import { AddServiceModal } from './src/screens/AddServiceModal';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { PublicBookingPreviewModal } from './src/screens/PublicBookingPreviewModal';
import { APP_NAME } from './src/config/appConfig';
import { api } from './src/api/apiClient';
import { UserRole } from './src/types';

const ROLE_KEY = 'app_user_role';

function MainApp() {
  const { t } = useTranslation();
  const { colors: currentColors, isDark } = useTheme();

  // App navigation state
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Master dashboard state
  const [activeTab, setActiveTab] = useState<TabKey>('jadval');
  const [isAddServiceModalVisible, setIsAddServiceModalVisible] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);

  // Public booking route detection (web only)
  const isPublicBookingRoute =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/b/');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = APP_NAME;
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = '/assets/logo.png';
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        const token = await api.initToken();
        const onboardingDone = await AsyncStorage.getItem('app_onboarding_done');
        const storedRole = await AsyncStorage.getItem(ROLE_KEY);

        setHasCompletedOnboarding(onboardingDone === 'true' || !!token);
        setIsAuthenticated(!!token);

        if (storedRole === 'CLIENT' || storedRole === 'MASTER') {
          setUserRole(storedRole as UserRole);
        } else if (token) {
          // If token exists, fetch profile from backend to restore user role
          try {
            const meRes = await api.getMe();
            if (meRes?.user?.role) {
              const role = meRes.user.role as UserRole;
              setUserRole(role);
              await AsyncStorage.setItem(ROLE_KEY, role);
            } else {
              setUserRole('MASTER');
            }
          } catch (e) {
            setUserRole('MASTER');
          }
        }
      } catch (e) {
        setHasCompletedOnboarding(false);
        setIsAuthenticated(false);
      }
    };
    initApp();
  }, []);

  const handleFinishOnboarding = async () => {
    await AsyncStorage.setItem('app_onboarding_done', 'true');
    setHasCompletedOnboarding(true);
  };

  const handleRoleSelected = async (role: UserRole) => {
    await AsyncStorage.setItem(ROLE_KEY, role);
    setSelectedRole(role);
  };

  const handleAuthSuccess = async () => {
    await AsyncStorage.setItem('app_onboarding_done', 'true');
    // Read role from storage (was set in handleRoleSelected)
    const storedRole = await AsyncStorage.getItem(ROLE_KEY);
    const role = storedRole === 'CLIENT' || storedRole === 'MASTER'
      ? (storedRole as UserRole)
      : 'MASTER';
    setUserRole(role);
    setSelectedRole(null); // clear temp selection
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    api.clearToken();
    await AsyncStorage.removeItem(ROLE_KEY);
    setIsAuthenticated(false);
    setUserRole(null);
    setSelectedRole(null);
    setActiveTab('jadval');
  };

  // --- Splash Screen (<= 2 seconds animated brand splash) ---
  if (!isSplashDone) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: currentColors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={currentColors.background}
        />
        <AnimatedSplashScreen onFinish={() => setIsSplashDone(true)} />
      </SafeAreaView>
    );
  }

  // --- Route 0: Public Booking Page (no auth required) ---
  if (isPublicBookingRoute) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: currentColors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={currentColors.background}
        />
        <PublicBookingPreviewModal
          visible={true}
          onClose={() => {
            if (typeof window !== 'undefined') {
              window.location.pathname = '/';
            }
          }}
        />
      </SafeAreaView>
    );
  }

  // --- Route 1: Onboarding (3 slides) ---
  if (hasCompletedOnboarding === false) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: currentColors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={currentColors.background}
        />
        <OnboardingScreen onFinish={handleFinishOnboarding} />
      </SafeAreaView>
    );
  }

  // --- Route 2: Role Selection (new users who haven't authed yet) ---
  if (isAuthenticated === false && !selectedRole) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: currentColors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={currentColors.background}
        />
        <RoleSelectionScreen onRoleSelected={handleRoleSelected} />
      </SafeAreaView>
    );
  }

  // --- Route 3: Auth (Phone → Code → Profile → [Location if MASTER]) ---
  if (isAuthenticated === false && selectedRole) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: currentColors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={currentColors.background}
        />
        <AuthScreen
          onSuccess={handleAuthSuccess}
          role={selectedRole}
          onClose={() => setSelectedRole(null)} // allow going back to role selection
        />
      </SafeAreaView>
    );
  }

  // --- Route 4a: CLIENT Dashboard ---
  if (isAuthenticated && userRole === 'CLIENT') {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: currentColors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={currentColors.background}
        />
        <ClientHomeScreen onLogout={handleLogout} />
      </SafeAreaView>
    );
  }

  // --- Route 4b: MASTER Dashboard (4-tab layout) ---
  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: currentColors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={currentColors.background}
      />

      {/* Top Header */}
      <Header
        onCalendarPress={() => setActiveTab('jadval')}
        onNotificationPress={() => setIsNotificationsVisible(true)}
      />

      {/* Main Tab Screen Content */}
      <View style={[styles.contentArea, { backgroundColor: currentColors.background }]}>
        {activeTab === 'jadval' && (
          <JadvalScreen onAddServicePress={() => setIsAddServiceModalVisible(true)} />
        )}
        {activeTab === 'analitika' && <AnalitikaScreen />}
        {activeTab === 'portfolio' && <PortfolioScreen />}
        {activeTab === 'profil' && (
          <ProfilScreen
            onLogout={handleLogout}
            onOpenAddService={() => setIsAddServiceModalVisible(true)}
          />
        )}
      </View>

      {/* 4-Tab Floating Nav Bar */}
      <FloatingTabBar activeTab={activeTab} onTabPress={setActiveTab} />

      {/* Modal: Bildirishnomalar (Notifications) */}
      <Modal
        visible={isNotificationsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <NotificationsScreen
          onBack={() => setIsNotificationsVisible(false)}
        />
      </Modal>

      {/* Modal: Yangi xizmat qo'shish */}
      <Modal
        visible={isAddServiceModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AddServiceModal
          onClose={() => setIsAddServiceModalVisible(false)}
          onServiceCreated={() => {
            setIsAddServiceModalVisible(false);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ModalToastProvider>
          <MainApp />
        </ModalToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentArea: {
    flex: 1,
  },
});
