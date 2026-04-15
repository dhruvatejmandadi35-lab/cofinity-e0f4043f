
-- Create role enums
CREATE TYPE public.org_type AS ENUM ('school', 'company', 'community');
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'member');
CREATE TYPE public.team_privacy AS ENUM ('public', 'private');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type org_type NOT NULL DEFAULT 'community',
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orgs viewable by everyone" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Owner can update org" ON public.organizations FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create orgs" ON public.organizations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can delete org" ON public.organizations FOR DELETE USING (auth.uid() = owner_id);

-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manager_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments viewable by everyone" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Org owner can manage departments" ON public.departments FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND owner_id = auth.uid()));
CREATE POLICY "Org owner can update departments" ON public.departments FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND owner_id = auth.uid()));
CREATE POLICY "Org owner can delete departments" ON public.departments FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND owner_id = auth.uid()));

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  privacy team_privacy NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public teams viewable by everyone" ON public.teams FOR SELECT 
  USING (privacy = 'public' OR auth.uid() = owner_id);
CREATE POLICY "Authenticated can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update team" ON public.teams FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete team" ON public.teams FOR DELETE USING (auth.uid() = owner_id);

-- Team Members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check team membership (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id
  )
$$;

CREATE POLICY "Members viewable by team members" ON public.team_members FOR SELECT 
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team owner or self can add members" ON public.team_members FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Team owner can update members" ON public.team_members FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid()));
CREATE POLICY "Members can leave, owner can remove" ON public.team_members FOR DELETE 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid()));

-- Messages (real-time chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view messages" ON public.messages FOR SELECT 
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can send messages" ON public.messages FOR INSERT 
  WITH CHECK (public.is_team_member(team_id, auth.uid()) AND auth.uid() = user_id);

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_time TIMESTAMPTZ NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public events viewable by all" ON public.events FOR SELECT 
  USING (is_public = true OR public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can create events" ON public.events FOR INSERT 
  WITH CHECK (public.is_team_member(team_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Creator can update events" ON public.events FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete events" ON public.events FOR DELETE USING (auth.uid() = created_by);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
