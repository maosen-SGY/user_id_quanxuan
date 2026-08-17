import { Card, Form, Input, Select } from 'antd'
import { NOTIFY_METHOD_LABELS, POPUP_SCENE_OPTIONS } from '../../constants/audience'

interface MarketingEventFormProps {
  name?: string
}

export default function MarketingEventForm({
  name = 'marketingEvents',
}: MarketingEventFormProps) {
  return (
    <Card size="small" title="营销事件 1" style={{ marginBottom: 16 }}>
      <Form.Item name={[name, 0, 'notifyMethods']} initialValue={['popup']} hidden>
        <Input />
      </Form.Item>

      <Form.Item label="通知方式">
        <Input value={NOTIFY_METHOD_LABELS.popup} disabled />
      </Form.Item>

      <Form.Item
        name={[name, 0, 'popupScene']}
        label="弹窗类型"
        rules={[{ required: true, message: '请选择弹窗类型' }]}
      >
        <Select placeholder="请选择弹窗类型" options={POPUP_SCENE_OPTIONS} />
      </Form.Item>
    </Card>
  )
}
