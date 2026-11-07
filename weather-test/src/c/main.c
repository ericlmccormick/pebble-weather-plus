#include <pebble.h>
static Window *window;
static TextLayer *heading,*body,*footer;
static char summary[160]="Waiting for weather source...";
static char details[256]="";
static char status[80]="";
static void redraw(void){
  text_layer_set_text(body,summary);
  text_layer_set_text(footer,details[0]?details:status);
}
static void inbox(DictionaryIterator *iter,void *ctx){
  Tuple *t=dict_find(iter,MESSAGE_KEY_summary);
  if(t){snprintf(summary,sizeof(summary),"%s",t->value->cstring);}
  t=dict_find(iter,MESSAGE_KEY_details);
  if(t){snprintf(details,sizeof(details),"%s",t->value->cstring);}
  t=dict_find(iter,MESSAGE_KEY_status);
  if(t){snprintf(status,sizeof(status),"%s",t->value->cstring);}
  redraw();
}
static void request(void){
  DictionaryIterator *out;
  if(app_message_outbox_begin(&out)==APP_MSG_OK){
    dict_write_uint8(out,MESSAGE_KEY_refresh,1);
    app_message_outbox_send();
  }
}
static void select_click(ClickRecognizerRef rec,void *ctx){request();}
static void click_config(void *ctx){window_single_click_subscribe(BUTTON_ID_SELECT,select_click);}
static void init(void){
  window=window_create();window_set_click_config_provider(window,click_config);
  Layer *root=window_get_root_layer(window);GRect b=layer_get_bounds(root);
  heading=text_layer_create(GRect(5,4,b.size.w-10,25));
  text_layer_set_font(heading,fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
  text_layer_set_text(heading,"Weather Source Test");layer_add_child(root,text_layer_get_layer(heading));
  body=text_layer_create(GRect(5,32,b.size.w-10,b.size.h-91));
  text_layer_set_font(body,fonts_get_system_font(FONT_KEY_GOTHIC_18));
  text_layer_set_text(body,summary);layer_add_child(root,text_layer_get_layer(body));
  footer=text_layer_create(GRect(5,b.size.h-57,b.size.w-10,55));
  text_layer_set_font(footer,fonts_get_system_font(FONT_KEY_GOTHIC_14));
  text_layer_set_text(footer,"SELECT: recheck");layer_add_child(root,text_layer_get_layer(footer));
  app_message_register_inbox_received(inbox);app_message_open(1024,128);
  window_stack_push(window,true);
}
static void deinit(void){text_layer_destroy(heading);text_layer_destroy(body);text_layer_destroy(footer);window_destroy(window);}
int main(void){init();app_event_loop();deinit();}
