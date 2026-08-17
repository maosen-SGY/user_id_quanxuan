import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Segmented,
  Space,
  TimePicker,
  Typography,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAudiences } from '../../utils/audienceStorage'
import { upsertOperatingActivity } from '../../utils/operatingActivityStorage'

const { Title, Text } = Typography

const MEMBER_DISCOUNT_FIELDS = [
  { key: 'monthlyStarter', cycle: '月会员', plan: '入门版' },
  { key: 'monthlyPro', cycle: '月会员', plan: '专业版' },
  { key: 'monthlyEnterprise', cycle: '月会员', plan: '企业版' },
  { key: 'yearlyStarter', cycle: '年度会员', plan: '入门版' },
  { key: 'yearlyPro', cycle: '年度会员', plan: '专业版' },
  { key: 'yearlyEnterprise', cycle: '年度会员', plan: '企业版' },
] as const

export default function OperatingActivityCreatePage() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const audienceOptions = useMemo(
    () =>
      getAudiences().map((audience) => ({
        label: `${audience.name}：${audience.id}`,
        value: audience.id,
      })),
    [],
  )

  const handleSave = async (status: 'draft' | 'published') => {
    try {
      const values = await form.validateFields()
      const startDate = values.startDate
      const startTime = values.startTime
      const endDate = values.endDate
      const endTime = values.endTime

      const startAt = dayjs(startDate)
        .hour(dayjs(startTime).hour())
        .minute(dayjs(startTime).minute())
        .second(0)
        .millisecond(0)
      const endAt = dayjs(endDate)
        .hour(dayjs(endTime).hour())
        .minute(dayjs(endTime).minute())
        .second(0)
        .millisecond(0)

      upsertOperatingActivity({
        title: values.title,
        audienceId: values.audienceId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        status,
      })

      message.success(
        status === 'draft'
          ? `草稿保存成功：${values.title}`
          : `活动发布成功：${values.title}`,
      )
    } catch {
      // validation failed
    }
  }

  return (
    <div style={{ padding: 24, background: '#f6f6f9', minHeight: '100vh' }}>
      <Space style={{ marginBottom: 4 }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/audiences')}
          style={{ paddingInline: 0 }}
        >
          返回
        </Button>
        <Title level={5} style={{ margin: 0 }}>
          新建运营活动
        </Title>
      </Space>  
      <Title level={1} style={{ margin: '0 0 4px', fontSize: 52, lineHeight: 1.1 }}>
        Create an entry
      </Title>
      <Text style={{ fontSize: 24, color: '#6b6f85' }}>API ID: operating-activity</Text>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          packageDiscountSwitch: false,
          priority: 100,
          discountConfig: {
            monthlyStarter: 0,
            monthlyPro: 0,
            monthlyEnterprise: 0,
            yearlyStarter: 0,
            yearlyPro: 0,
            yearlyEnterprise: 0,
          },
        }}
        style={{ marginTop: 20 }}
      >
        <Row gutter={16} align="top">
          <Col span={18}>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Form.Item
                label="活动名称"
                name="title"
                rules={[{ required: true, message: '请输入活动名称' }]}
              >
                <Input style={{ width: 360 }} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="活动起始时间"
                    required
                    style={{ marginBottom: 0 }}
                  >
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="startDate"
                          rules={[{ required: true, message: '请选择日期' }]}
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="startTime"
                          rules={[{ required: true, message: '请选择时间' }]}
                        >
                          <TimePicker style={{ width: '100%' }} format="HH:mm" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="活动结束时间"
                    required
                    style={{ marginBottom: 0 }}
                  >
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="endDate"
                          rules={[{ required: true, message: '请选择日期' }]}
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="endTime"
                          rules={[{ required: true, message: '请选择时间' }]}
                        >
                          <TimePicker style={{ width: '100%' }} format="HH:mm" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="活动类型"
                name="activityType"
                rules={[{ required: true, message: '请选择活动类型' }]}
              >
                <Select
                  placeholder="Choose here"
                  style={{ width: 360 }}
                  options={[
                    { label: '新人活动', value: 'new_user' },
                    { label: '续费活动', value: 'renewal' },
                    { label: '召回活动', value: 'recall' },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="活动优先级"
                name="priority"
                rules={[{ required: true, message: '请输入活动优先级' }]}
              >
                <InputNumber style={{ width: 360 }} min={1} />
              </Form.Item>

              <Form.Item
                label="归属国家*"
                name="country"
                rules={[{ required: true, message: '请选择归属国家' }]}
              >
                <Select
                  placeholder="Select..."
                  options={[
                    { label: '中国', value: 'CN' },
                    { label: '美国', value: 'US' },
                    { label: '英国', value: 'UK' },
                    { label: '德国', value: 'DE' },
                    { label: '法国', value: 'FR' },
                    { label: '日本', value: 'JP' },
                    { label: '印尼', value: 'ID' },
                    { label: '巴西', value: 'BR' },
                  ]}
                />
              </Form.Item>

              <Form.Item label="数据站点" name="site">
                <Select
                  placeholder="Select..."
                  options={[
                    { label: '巴西站', value: 'BR' },
                    { label: '印尼站', value: 'ID' },
                    { label: '中国站', value: 'CN' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                label="人群ID"
                name="audienceId"
                rules={[{ required: true, message: '请选择人群ID' }]}
              >
                <Select
                  placeholder="Select..."
                  options={audienceOptions}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Card>

            <Card size="small">
              <Text style={{ fontSize: 24, fontWeight: 600 }}>
                -------------------- 活动会员套餐折扣 --------------------
              </Text>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="packageDiscountSwitch"
                    style={{ marginTop: 12, marginBottom: 20 }}
                  >
                    <Segmented
                      options={[
                        { label: 'FALSE', value: false },
                        { label: 'TRUE', value: true },
                      ]}
                      style={{ width: 280 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                {MEMBER_DISCOUNT_FIELDS.map((field) => (
                  <Col span={8} key={field.key}>
                    <Form.Item
                      label={`${field.cycle} - ${field.plan} 折扣比例`}
                      name={['discountConfig', field.key]}
                      rules={[{ required: true, message: '请输入折扣比例' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        max={100}
                        precision={2}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="月会员渠道" name="monthlyChannel">
                    <Select
                      placeholder="Choose here"
                      options={[
                        { label: 'App', value: 'app' },
                        { label: 'Web', value: 'web' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="年度会员渠道" name="yearlyChannel">
                    <Select
                      placeholder="Choose here"
                      options={[
                        { label: 'App', value: 'app' },
                        { label: 'Web', value: 'web' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

            </Card>
          </Col>

          <Col span={6}>
            <Card title="INFORMATION" size="small">
              <div style={{ lineHeight: 2.2, color: '#2c2e3f' }}>
                <div>
                  <Text strong>Created</Text>
                </div>
                <div>By</div>
                <div style={{ marginTop: 8 }}>
                  <Text strong>Last update</Text>
                </div>
                <div>By</div>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />
        <Space>
          <Button onClick={() => handleSave('draft')}>保存草稿</Button>
          <Button type="primary" onClick={() => handleSave('published')}>
            发布活动
          </Button>
        </Space>
      </Form>
    </div>
  )
}
