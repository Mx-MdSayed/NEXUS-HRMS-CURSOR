import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CardContent, Form, FormGrid, Input, Select, Switch, Textarea } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { notificationTemplateService } from '../services/notificationTemplateService'
import type { NotificationTemplate } from '../types'

type TemplateFormValues = Pick<
  NotificationTemplate,
  'code' | 'name' | 'description' | 'category' | 'priority' | 'titleTemplate' | 'messageTemplate' | 'mandatory' | 'isActive'
>

export function NotificationTemplateFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const form = useForm<TemplateFormValues>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      category: 'system',
      priority: 'normal',
      titleTemplate: '',
      messageTemplate: '',
      mandatory: false,
      isActive: true,
    },
  })

  useEffect(() => {
    if (!id) return
    void notificationTemplateService.getById(id).then((template) => {
      form.reset({
        code: template.code,
        name: template.name,
        description: template.description ?? '',
        category: template.category,
        priority: template.priority,
        titleTemplate: template.titleTemplate,
        messageTemplate: template.messageTemplate,
        mandatory: template.mandatory,
        isActive: template.isActive,
      })
    })
  }, [form, id])

  const submit = async (values: TemplateFormValues) => {
    setSaving(true)
    try {
      const payload = {
        ...values,
        updatedBy: user?.name ?? 'System',
      }
      if (id) await notificationTemplateService.update(id, payload)
      else await notificationTemplateService.create(payload)
      showSuccess('Notification template saved.')
      navigate('/notifications/templates')
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to save template.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">
          {id ? 'Edit Template' : 'New Template'}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">Use {'{{variable}}'} placeholders for runtime values.</p>
      </div>
      <Card>
        <CardContent>
          <Form onSubmit={form.handleSubmit(submit)} className="space-y-6">
            <FormGrid columns={2}>
              <Input label="Code" requiredMark {...form.register('code', { required: true })} />
              <Input label="Name" requiredMark {...form.register('name', { required: true })} />
              <Select
                label="Category"
                options={['leave', 'attendance', 'profile', 'payroll', 'payslip', 'workflow', 'announcement', 'system'].map((value) => ({ label: value, value }))}
                {...form.register('category' as const)}
              />
              <Select
                label="Priority"
                options={['low', 'normal', 'high', 'urgent'].map((value) => ({ label: value, value }))}
                {...form.register('priority' as const)}
              />
              <div className="md:col-span-2">
                <Textarea label="Description" {...form.register('description')} />
              </div>
              <Input label="Title template" requiredMark {...form.register('titleTemplate', { required: true })} />
              <div className="md:col-span-2">
                <Textarea label="Message template" requiredMark {...form.register('messageTemplate', { required: true })} />
              </div>
            </FormGrid>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.watch('mandatory')} onCheckedChange={(checked) => form.setValue('mandatory', checked)} />
                Mandatory
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.watch('isActive')} onCheckedChange={(checked) => form.setValue('isActive', checked)} />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/notifications/templates')}>Cancel</Button>
              <Button type="submit" isLoading={saving}>Save template</Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
