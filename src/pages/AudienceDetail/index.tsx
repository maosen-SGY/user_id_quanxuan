import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  message,
  Radio,
  Select,
  Space,
  Typography,
  Upload,
} from 'antd'
import {
  ArrowLeftOutlined,
  FileExcelOutlined,
  InboxOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import type { UploadFile } from 'antd'
import { DYNAMIC_TAG_OPTIONS } from '../../constants/audience'
import type { Audience } from '../../types/audience'
import {
  getAudienceById,
  updateAudienceConfig,
} from '../../utils/audienceStorage'
import {
  downloadUserIdExcelTemplate,
  parseUserIdsFromExcel,
} from '../../utils/excelParser'

const { Title, Text } = Typography
const { Dragger } = Upload

export default function AudienceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [audience, setAudience] = useState<Audience | null>(null)
  const [userIds, setUserIds] = useState<string[] | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)

  const buildExcelFileItem = (fileName: string): UploadFile => ({
    uid: 'last-excel',
    name: fileName,
    status: 'done',
  })

  useEffect(() => {
    if (!id) return
    const data = getAudienceById(id)
    if (!data) {
      message.error('人群不存在')
      navigate('/audiences')
      return
    }
    setAudience(data)
    setUserIds(null)
    setFileList(
      data.excelFileName ? [buildExcelFileItem(data.excelFileName)] : [],
    )
    const today = new Date()
    const nextYear = new Date(today)
    nextYear.setFullYear(today.getFullYear() + 1)
    const toDateValue = (value?: string) => value?.slice(0, 10)
    const pad = (n: number) => String(n).padStart(2, '0')
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    form.setFieldsValue({
      validFrom: toDateValue(data.validFrom) || formatDate(today),
      validTo: toDateValue(data.validTo) || formatDate(nextYear),
      dynamicTags: {
        tagColumns: data.dynamicTags?.tagColumns?.length
          ? data.dynamicTags.tagColumns
          : [{ tagIds: [] }],
      },
    })
  }, [id, navigate, form])

  const handleFileUpload = async (file: File) => {
    try {
      const ids = await parseUserIdsFromExcel(file)
      if (ids.length === 0) {
        message.warning('未从文件中解析到有效的用户ID')
        return false
      }
      setUserIds(ids)
      setFileList([{ uid: file.name, name: file.name, status: 'done' }])
      message.success(`已重新上传 ${file.name}，共 ${ids.length} 个用户ID`)
    } catch {
      message.error('文件解析失败，请检查文件格式')
    }
    return false
  }

  const handleSubmit = async () => {
    if (!id || !audience) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const normalizedTagColumns = (values.dynamicTags?.tagColumns ?? [])
        .filter((item: { tagIds?: string[] } | undefined) => item?.tagIds?.length)
        .map((item: { tagIds: string[] }) => ({ tagIds: item.tagIds }))

      if (audience.type === 'dynamic' && normalizedTagColumns.length === 0) {
        message.error('请至少选择一列标签')
        setSubmitting(false)
        return
      }

      if (
        audience.type === 'static' &&
        userIds === null &&
        !audience.excelFileName &&
        !audience.userIds?.length
      ) {
        message.error('请上传人群 Excel 文件')
        setSubmitting(false)
        return
      }

      updateAudienceConfig(id, {
        validFrom: values.validFrom,
        validTo: values.validTo,
        dynamicTags:
          audience.type === 'dynamic'
            ? { tagColumns: normalizedTagColumns }
            : audience.dynamicTags,
        ...(audience.type === 'static' && userIds
          ? {
              userIds,
              estimatedCoverage: userIds.length,
              excelFileName: fileList[0]?.name ?? audience.excelFileName,
            }
          : {}),
      })
      message.success('保存成功')
      navigate('/audiences')
    } catch {
      // validation failed
    } finally {
      setSubmitting(false)
    }
  }

  if (!audience) return null

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/audiences')}
        style={{ padding: 0, marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Title level={5}>编辑人群</Title>

      <Form form={form} layout="vertical">
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="人群ID">
            <Input value={audience.id} disabled />
          </Form.Item>

          <Form.Item label="人群名称">
            <Input value={audience.name} disabled />
          </Form.Item>

          <Form.Item label="人群描述">
            <Input.TextArea value={audience.description} disabled rows={3} />
          </Form.Item>

          <Form.Item label="人群有效期" required>
            <Space align="center" wrap>
              <Form.Item
                name="validFrom"
                noStyle
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <Input type="date" style={{ width: 180 }} />
              </Form.Item>
              <span>至</span>
              <Form.Item
                name="validTo"
                noStyle
                rules={[
                  { required: true, message: '请选择结束日期' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const start = getFieldValue('validFrom') as string | undefined
                      if (!value || !start || value >= start) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('结束日期不能早于开始日期'))
                    },
                  }),
                ]}
              >
                <Input type="date" style={{ width: 180 }} />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item label="人群类型">
            <Radio.Group value={audience.type} disabled>
              <Radio value="dynamic">动态人群（基于标签圈选）</Radio>
              <Radio value="static">静态人群（导入用户ID）</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="创建人">
            <Input value={audience.creator} disabled />
          </Form.Item>

          <Form.Item label="创建时间">
            <Input value={audience.createdAt} disabled />
          </Form.Item>
        </Card>

        {audience.type === 'static' ? (
          <Card title="人群 Excel" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="上一次上传的 Excel">
              <Input
                prefix={<FileExcelOutlined />}
                value={fileList[0]?.name || audience.excelFileName || '暂无文件'}
                disabled
              />
            </Form.Item>
            <Space style={{ marginBottom: 12 }}>
              <Button onClick={downloadUserIdExcelTemplate}>下载导入模板</Button>
              <Text type="secondary">模板字段：user_id，重新上传将覆盖上一次文件</Text>
            </Space>
            <Dragger
              accept=".xlsx,.xls,.csv"
              fileList={userIds ? fileList : []}
              beforeUpload={handleFileUpload}
              onRemove={() => {
                setUserIds(null)
                setFileList(
                  audience.excelFileName
                    ? [buildExcelFileItem(audience.excelFileName)]
                    : [],
                )
                return true
              }}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">重新上传 Excel</p>
              <p className="ant-upload-hint">
                支持 .xlsx / .xls / .csv，第一列为 user_id。不会展示用户明细。
              </p>
            </Dragger>
          </Card>
        ) : (
          <Card title="圈选条件" size="small" style={{ marginBottom: 16 }}>
            <Form.List name={['dynamicTags', 'tagColumns']}>
              {(fields, { add, remove }) => (
                <>
                  <div style={{ marginBottom: 8, color: '#666' }}>
                    同列选中标签为「且」关系，列与列之间为「或」关系
                  </div>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      size="small"
                      title={`列 ${index + 1}`}
                      style={{ marginBottom: 12 }}
                      extra={
                        fields.length > 1 ? (
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            删除列
                          </Button>
                        ) : null
                      }
                    >
                      <Form.Item
                        name={[field.name, 'tagIds']}
                        rules={[
                          {
                            required: true,
                            type: 'array',
                            min: 1,
                            message: '请至少选择一个标签',
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          mode="multiple"
                          placeholder="请选择标签"
                          options={DYNAMIC_TAG_OPTIONS}
                          optionFilterProp="label"
                        />
                      </Form.Item>
                    </Card>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ tagIds: [] })}
                    block
                  >
                    增加一列
                  </Button>
                </>
              )}
            </Form.List>
          </Card>
        )}

        <Divider />

        <Space>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            保存修改
          </Button>
          <Button onClick={() => navigate('/audiences')}>取消</Button>
        </Space>
      </Form>
    </div>
  )
}
