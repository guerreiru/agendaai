import { LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Fox from "../../assets/fox.svg";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";

export type SideNavItem = {
	label: string;
	to: string;
	icon: React.ReactNode;
	disabled?: boolean;
};

type SideNavLayoutProps = {
	eyebrow: string;
	title: string;
	items: SideNavItem[];
};

export function SideNavLayout({ eyebrow, title, items }: SideNavLayoutProps) {
	const { logout, isLoading } = useAuth();
	const navigate = useNavigate();

	async function handleLogout() {
		await logout();
		navigate("/login", { replace: true });
	}

	return (
		<div className="grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start h-full">
			<aside className=" bg-slate-950 lg:sticky h-full flex flex-col justify-between">
				<div>
					<div className="mb-4 border-b border-gray-900 p-6 flex gap-1.5">
						<img src={Fox} alt="Fox" />
						<div>
							<div className="flex items-center text-lg font-bold">
								<p className="font-jamjuree text-orange-600">PLA</p>
								<p className="font-jamjuree text-white">NNIE</p>
							</div>
							<p className="text-slate-500 text-xs">{eyebrow}</p>
						</div>
					</div>
					<nav aria-label={title} className="flex flex-col gap-2 px-4">
						{items.map((item) => {
							if (item.disabled) {
								return (
									<span
										className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300"
										key={item.label}
									>
										{item.icon}
										{item.label}
									</span>
								);
							}

							return (
								<NavLink
									className={({ isActive }) =>
										[
											"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
											isActive
												? "bg-lime-300 text-slate-950 hover:bg-lime-200 font-medium shadow-sm"
												: "bg-white/10 text-slate-400 hover:bg-slate-100 hover:text-slate-950 font-medium",
										].join(" ")
									}
									key={item.label}
									to={item.to}
								>
									{item.icon}
									{item.label}
								</NavLink>
							);
						})}
					</nav>
				</div>

				<div className="sticky flex justify-center items-center bottom-1">
					<Button
						variant="ghost"
						disabled={isLoading}
						onClick={() => void handleLogout()}
						className="flex justify-start items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-slate-950 hover:bg-slate-100"
						type="button"
					>
						<LogOut className="size-3.5" />
						Sair
					</Button>
				</div>
			</aside>

			<div className="min-w-0 h-full p-8">
				<Outlet />
			</div>
		</div>
	);
}
