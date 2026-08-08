import { useMemo, useState } from 'react'
import { Plus, Settings2, Users } from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  ConfirmDialog,
  DataTable,
  DateInput,
  DateRangeInput,
  Drawer,
  Dropdown,
  EmptyState,
  ErrorState,
  FileUpload,
  FilterBar,
  FormGrid,
  FormSection,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
  PageLoader,
  Pagination,
  Radio,
  RadioGroup,
  SearchInput,
  Select,
  StatCard,
  StatusBadge,
  Switch,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  CardSkeleton,
  FormSkeleton,
  TableSkeleton,
} from '@/components/ui'
import { showError, showInfo, showSuccess, showWarning } from '@/utils/toast'

const sampleRows = [
  { id: '1', name: 'Alex Morgan', role: 'HR Admin', status: 'active' as const },
  { id: '2', name: 'Jordan Lee', role: 'Manager', status: 'pending' as const },
  { id: '3', name: 'Sam Patel', role: 'Employee', status: 'inactive' as const },
]

export function UiPreviewPage() {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [switchOn, setSwitchOn] = useState(true)
  const [radioValue, setRadioValue] = useState('office')
  const [uploaded, setUploaded] = useState<{ name: string; size: number } | null>(null)
  const [tableLoading, setTableLoading] = useState(false)

  const filteredRows = useMemo(
    () =>
      sampleRows.filter((row) =>
        row.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="UI Preview"
        description="Internal Module 2 design system showcase. Not part of normal HRMS navigation."
        breadcrumbs={[{ label: 'Dev' }, { label: 'UI Preview' }]}
        actions={
          <>
            <Button variant="outline" leftIcon={<Settings2 className="h-4 w-4" />}>
              Secondary
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />}>Primary action</Button>
          </>
        }
      />

      <section className="space-y-3">
        <h2 className="text-section-title">Buttons</h2>
        <Card>
          <CardContent className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Tooltip content="Settings">
              <Button variant="outline" iconOnly aria-label="Settings">
                <Settings2 className="h-4 w-4" />
              </Button>
            </Tooltip>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-section-title">Form controls</h2>
        <FormSection title="Personal information" description="Reusable one/two-column form layout.">
          <FormGrid columns={2}>
            <Input label="Full name" placeholder="Alex Morgan" requiredMark hint="Shown on employee profile" />
            <Input label="Email" type="email" placeholder="alex@company.com" error="Email is required" />
            <Select
              label="Department"
              placeholder="Select department"
              options={[
                { label: 'Engineering', value: 'engineering' },
                { label: 'Human Resources', value: 'hr' },
                { label: 'Finance', value: 'finance' },
              ]}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            />
            <Input label="Salary" type="number" placeholder="0" leftIcon={<span className="text-xs">₹</span>} />
            <DateInput label="Join date" />
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search employees…" />
            <div className="md:col-span-2">
              <Textarea label="Notes" placeholder="Additional comments" hint="Visible to HR admins only" />
            </div>
          </FormGrid>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Checkbox label="Send welcome email" description="Notify the employee after onboarding." defaultChecked />
            <Switch
              label="Enable notifications"
              description="Receive leave and payroll alerts."
              checked={switchOn}
              onCheckedChange={setSwitchOn}
            />
            <RadioGroup
              label="Work mode"
              name="work-mode"
              value={radioValue}
              onValueChange={setRadioValue}
              orientation="horizontal"
            >
              <Radio label="Office" value="office" />
              <Radio label="Remote" value="remote" />
              <Radio label="Hybrid" value="hybrid" />
            </RadioGroup>
            <DateRangeInput
              label="Report period"
              value={dateRange}
              onValueChange={setDateRange}
              hint="Used later for attendance and payroll filters"
            />
          </div>
        </FormSection>
      </section>

      <section className="space-y-3">
        <h2 className="text-section-title">Badges, status & avatars</h2>
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" />
              <StatusBadge status="inactive" />
              <StatusBadge status="pending" />
              <StatusBadge status="approved" />
              <StatusBadge status="rejected" />
              <StatusBadge status="present" />
              <StatusBadge status="absent" />
              <StatusBadge status="late" />
              <StatusBadge status="draft" />
              <StatusBadge status="processing" />
              <StatusBadge status="paid" />
            </div>
            <div className="flex items-center gap-3">
              <Avatar name="Alex Morgan" size="sm" />
              <Avatar name="Jordan Lee" size="md" />
              <Avatar name="Sam Patel" size="lg" />
              <Avatar name="No Image" src="https://invalid.example/avatar.png" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-section-title">Stat cards</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Employees" value="245" icon={Users} trend="+12 this month" trendDirection="up" description="Across all departments" />
          <StatCard title="Attrition" value="2.1%" trend="-0.4%" trendDirection="down" />
          <StatCard title="Open Roles" value="8" trend="Stable" trendDirection="neutral" />
          <StatCard title="Loading KPI" value="" isLoading />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-section-title">Filter bar & table</h2>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search employees…"
          onReset={() => {
            setSearch('')
            setDepartment('')
          }}
          showApply
          onApply={() => showInfo('Filters applied (preview only)')}
          filters={
            <Select
              label="Department"
              placeholder="All departments"
              options={[
                { label: 'Engineering', value: 'engineering' },
                { label: 'HR', value: 'hr' },
              ]}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            />
          }
          actions={
            <Button variant="outline" size="sm" onClick={() => setTableLoading((value) => !value)}>
              Toggle loading
            </Button>
          }
        />

        <DataTable
          isLoading={tableLoading}
          isEmpty={!tableLoading && filteredRows.length === 0}
          emptyTitle="No employees found"
          emptyDescription="Try adjusting your search or add a new employee."
          emptyActionLabel="Add Employee"
          onEmptyAction={() => showInfo('Add employee will be available in Module 5')}
          columnCount={4}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row, index) => (
              <TableRow key={row.id} selected={index === 0}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} size="sm" />
                    <span className="font-medium text-surface-900 dark:text-surface-50">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <TableActions
                    onView={() => showInfo(`View ${row.name}`)}
                    onEdit={() => showInfo(`Edit ${row.name}`)}
                    onDelete={() => setConfirmOpen(true)}
                    moreItems={[
                      {
                        id: 'duplicate',
                        label: 'Duplicate',
                        onClick: () => showInfo('Duplicate action preview'),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
        <Pagination page={page} totalPages={8} onPageChange={setPage} />
      </section>

      <section className="space-y-3">
        <h2 className="text-section-title">Overlays</h2>
        <Card>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Open confirm
            </Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Open drawer
            </Button>
            <Dropdown
              trigger={
                <Button variant="outline">Dropdown menu</Button>
              }
              items={[
                { id: 'profile', label: 'My Profile', onClick: () => showInfo('Profile') },
                { id: 'settings', label: 'Settings', onClick: () => showInfo('Settings') },
                { id: 'logout', label: 'Logout', danger: true, onClick: () => showWarning('Logout preview') },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-section-title">Tabs</h2>
        <Card>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <p className="text-body">Overview tab content for future employee profiles.</p>
              </TabsContent>
              <TabsContent value="personal">
                <p className="text-body">Personal information tab placeholder.</p>
              </TabsContent>
              <TabsContent value="employment">
                <p className="text-body">Employment details tab placeholder.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-section-title">Toast helpers</h2>
        <Card>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="success" onClick={() => showSuccess('Employee created successfully')}>
              Success toast
            </Button>
            <Button variant="danger" onClick={() => showError('Unable to save employee')}>
              Error toast
            </Button>
            <Button variant="outline" onClick={() => showWarning('Payroll period is closing soon')}>
              Warning toast
            </Button>
            <Button variant="secondary" onClick={() => showInfo('Design system preview only')}>
              Info toast
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-section-title">File upload</h2>
        <Card>
          <CardContent>
            <FileUpload
              label="Employee document"
              hint="UI only — no backend upload in Module 2"
              value={uploaded}
              progress={uploaded ? 72 : null}
              onFileSelect={(file) => {
                if (!file) {
                  setUploaded(null)
                  return
                }
                setUploaded({ name: file.name, size: file.size })
                showSuccess('File selected (preview only)')
              }}
              onRemove={() => setUploaded(null)}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-section-title">States & loaders</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <EmptyState
            title="No employees found"
            description="Try adjusting your search or add a new employee."
            actionLabel="Add Employee"
            onAction={() => showInfo('Action placeholder')}
          />
          <ErrorState
            title="Unable to load data"
            message="Please try again. Contact support if the issue continues."
            onRetry={() => showInfo('Retry placeholder')}
          />
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Loading samples</CardTitle>
                <CardDescription>Spinner, page loader, and skeletons.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <LoadingSpinner size="sm" />
                <LoadingSpinner />
                <LoadingSpinner size="lg" />
              </div>
              <PageLoader label="Loading page" className="min-h-[120px]" />
            </CardContent>
            <CardFooter>
              <p className="text-helper">Prefer skeletons for content placeholders.</p>
            </CardFooter>
          </Card>
          <div className="space-y-4">
            <CardSkeleton />
            <FormSkeleton fields={2} />
            <TableSkeleton rows={3} columns={3} />
          </div>
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add employee"
        description="Modal foundation for future create/edit flows."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setModalOpen(false)
              showSuccess('Saved (preview only)')
            }}
            >
              Save
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <Input label="First name" placeholder="Alex" />
          <Input label="Last name" placeholder="Morgan" />
        </FormGrid>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          showWarning('Delete confirmed (preview only)')
        }}
        title="Are you sure you want to delete this employee?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Employee quick view"
        description="Reusable drawer for filters and detail panels."
        side="right"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
            <Button onClick={() => showInfo('Drawer action')}>Continue</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar name="Alex Morgan" size="lg" />
            <div>
              <p className="text-card-title">Alex Morgan</p>
              <p className="text-helper">HR Admin</p>
            </div>
          </div>
          <StatusBadge status="active" />
          <p className="text-body">
            Use drawers for mobile filters, quick views, and compact forms in later modules.
          </p>
        </div>
      </Drawer>
    </div>
  )
}
