import { useState } from 'react'
import {
  Button,
  Card,
  DatePicker,
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
  InboxOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'
import { DYNAMIC_TAG_OPTIONS } from '../../constants/audience'
import type { AudienceType } from '../../types/audience'
import { createAudience } from '../../utils/audienceStorage'
import {
  downloadUserIdExcelTemplate,
  parseUserIdsFromExcel,
} from '../../utils/excelParser'

const { TextArea } = Input
const { Title, Text } = Typography
const { Dragger } = Upload
const { RangePicker } = DatePicker

export default function AudienceCreatePage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [audienceType, setAudienceType] = useState<AudienceType>('dynamic')
  const [userIds, setUserIds] = useState<string[]>([])
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleFileUpload = async (file: File) => {
    try {
      const ids = await parseUserIdsFromExcel(file)
      if (ids.length === 0) {
        message.warning('未从文件中解析到有效的用户ID')
        return false
      }
      setUserIds(ids)
      setFileList([{ uid: '-1', name: file.name, status: 'done' }])
      message.success(`成功导入 ${ids.length} 个用户ID`)
    } catch {
      message.error('文件解析失败，请检查文件格式')
    }
    return false
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      if (audienceType === 'static' && userIds.length === 0) {
        message.error('请导入用户ID Excel 文件')
        setSubmitting(false)
        return
      }

      const normalizedTagColumns = (values.dynamicTags?.tagColumns ?? [])
        .filter((item: { tagIds?: string[] } | undefined) => item?.tagIds?.length)
        .map((item: { tagIds: string[] }) => ({ tagIds: item.tagIds }))

      if (audienceType === 'dynamic' && normalizedTagColumns.length === 0) {
        message.error('请至少选择一列标签')
        setSubmitting(false)
        return
      }

      const audience = createAudience({
        name: values.name,
        description: values.description,
        type: audienceType,
        creator: '当前用户',
        userIds: audienceType === 'static' ? userIds : undefined,
        dynamicTags:
          audienceType === 'dynamic'
            ? {
                tagColumns: normalizedTagColumns,
              }
            : undefined,
        marketingEvents: [],
        validFrom: values.validPeriod[0].format('YYYY-MM-DD'),
        validTo: values.validPeriod[1].format('YYYY-MM-DD'),
        excelFileName: audienceType === 'static' ? fileList[0]?.name : undefined,
      })

      message.success(`人群「${audience.name}」创建成功`)
      navigate('/audiences')
    } catch {
      // validation failed
    } finally {
      setSubmitting(false)
    }
  }

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

      <Title level={5}>创建人群</Title>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          dynamicTags: {
            tagColumns: [{ tagIds: [] }],
          },
        }}
      >
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="name"
            label="人群名称"
            rules={[{ required: true, message: '请输入人群名称' }]}
          >
            <Input placeholder="请输入人群名称" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            name="description"
            label="人群描述"
            rules={[{ required: true, message: '请输入人群描述' }]}
          >
            <TextArea rows={3} placeholder="请输入人群描述" maxLength={200} showCount />
          </Form.Item>

          <Form.Item
            name="validPeriod"
            label="人群有效期"
            rules={[{ required: true, message: '请选择人群有效期' }]}
            initialValue={[dayjs(), dayjs().add(1, 'year')]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="人群类型" required>
            <Radio.Group
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value)}
            >
              <Radio value="dynamic">动态人群（基于标签圈选）</Radio>
              <Radio value="static">静态人群（导入用户ID）</Radio>
            </Radio.Group>
          </Form.Item>
        </Card>

        {audienceType === 'static' ? (
          <Card title="导入用户ID" size="small" style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 12 }}>
              <Button onClick={downloadUserIdExcelTemplate}>下载导入模板</Button>
              <Text type="secondary">模板字段：user_id</Text>
            </Space>
            <Dragger
              accept=".xlsx,.xls,.csv"
              fileList={fileList}
              beforeUpload={handleFileUpload}
              onRemove={() => {
                setUserIds([])
                setFileList([])
              }}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽 Excel 文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 .xlsx / .xls / .csv 格式，第一列为 user_id。上传后只展示文件，不展示用户明细。
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
            提交
          </Button>
          <Button onClick={() => navigate('/audiences')}>取消</Button>
        </Space>
      </Form>
    </div>
  )
}
