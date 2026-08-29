import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Stethoscope, BookOpen, Scale, FileText, LogOut, Home, 
  Search, Settings, User 
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.webp";

const clinicalItems = [
  { title: "Clinical Q&A", url: "/dashboard/clinical", icon: Stethoscope },
  { title: "Literature Search", url: "/dashboard/literature", icon: BookOpen },
  { title: "Treatment Comparison", url: "/dashboard/compare", icon: Scale },
  { title: "Content Analysis", url: "/dashboard/analyze", icon: FileText },
];

const generalItems = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "History", url: "/dashboard/history", icon: Search },
];

export function ClinicalSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-2.5">
        <img src={logo} alt="Evidexus" className="h-8 w-8 object-contain shrink-0" />
        {!collapsed && (
          <span className="font-semibold text-sidebar-foreground text-base tracking-tight">
            Evidexus
          </span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Clinical Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clinicalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && user && (
          <div className="px-2 py-2 rounded-lg bg-sidebar-accent mb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-sidebar-primary/15 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {user.email}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60">Physician</p>
              </div>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
