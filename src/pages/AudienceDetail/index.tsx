import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import MarketingEventForm from '../../components/MarketingEventForm'
import {
  DYNAMIC_TAG_OPTIONS,
  NOTIFY_METHOD_LABELS,
  POPUP_SCENE_LABELS,
} from '../../constants/audience'
import type { Audience } from '../../types/audience'
import {
  getAudienceById,
  updateAudienceConfig,
} from '../../utils/audienceStorage'

const { Title } = Typography

export default function AudienceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [audience, setAudience] = useState<Audience | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    const data = getAudienceById(id)
    if (!data) {
      message.error('人群不存在')
      navigate('/audiences')
      return
    }
    setAudience(data)
    form.setFieldsValue({
      dynamicTags: {
        tagColumns: data.dynamicTags?.tagColumns?.length
          ? data.dynamicTags.tagColumns
          : [{ tagIds: [] }],
      },
      marketingEvents: data.marketingEvents,
    })
  }, [id, navigate, form])

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

      updateAudienceConfig(
        id,
        values.marketingEvents,
        audience.type === 'dynamic'
          ? { tagColumns: normalizedTagColumns }
          : audience.dynamicTags,
      )
      message.success('营销事件更新成功')
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

      <Title level={5}>人群详情</Title>

      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="人群ID">
            <Input value={audience.id} disabled />
          </Form.Item>
          <Form.Item label="人群名称">
            <Input value={audience.name} disabled />
          </Form.Item>
          <Form.Item label="人群描述">
            <Input.TextArea value={audience.description} disabled rows={3} />
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
        </Form>
      </Card>

      {audience.type === 'static' && audience.userIds && (
        <Card title="导入用户ID" size="small" style={{ marginBottom: 16 }}>
          <div>
            共 {audience.userIds.length} 个用户
          </div>
          <div style={{ marginTop: 8 }}>
            {audience.userIds.slice(0, 10).map((uid) => (
              <Tag key={uid} style={{ marginBottom: 4 }}>
                {uid}
              </Tag>
            ))}
            {audience.userIds.length > 10 && (
              <Tag>+{audience.userIds.length - 10} 更多</Tag>
            )}
          </div>
        </Card>
      )}

      <Form form={form} layout="vertical">
        {audience.type === 'dynamic' && (
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

        <Card
          title="关联营销事件"
          size="small"
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              {audience.marketingEvents.map((e, i) => (
                <Tag key={i} color="purple">
                  {NOTIFY_METHOD_LABELS.popup}
                  {e.popupScene ? ` · ${POPUP_SCENE_LABELS[e.popupScene]}` : ''}
                </Tag>
              ))}
            </Space>
          }
        >
          <MarketingEventForm />
        </Card>

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
